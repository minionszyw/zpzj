from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.db.session import get_session
from app.models.user import User
from app.models.chat import ChatSession, Message
from app.models.fact import MemoryFact
from app.agent.graph import build_graph
from app.services.archive_service import ArchiveService
from sqlalchemy.future import select
from sqlalchemy import delete
import json
import asyncio

router = APIRouter()

@router.post("/sessions", response_model=ChatSession)
async def create_session(
    archive_id: UUID,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(deps.get_current_user)
):
    archive = await ArchiveService.get(db, archive_id, current_user.id)
    session = ChatSession(
        user_id=current_user.id,
        archive_id=archive_id,
        title=f"关于 {archive.name} 的咨询"
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session

@router.get("/sessions", response_model=List[ChatSession])
async def list_sessions(
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(deps.get_current_user)
):
    result = await db.execute(
        select(ChatSession).where(ChatSession.user_id == current_user.id).order_by(ChatSession.created_at.desc())
    )
    return result.scalars().all()

@router.get("/sessions/{session_id}/messages", response_model=List[Message])
async def get_session_messages(
    session_id: UUID,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(deps.get_current_user)
):
    # 简单权限检查
    session_res = await db.execute(select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == current_user.id))
    if not session_res.scalars().first():
        raise HTTPException(status_code=404, detail="Session not found")
        
    result = await db.execute(
        select(Message).where(Message.session_id == session_id).order_by(Message.created_at.asc())
    )
    return result.scalars().all()

@router.post("/completions")
async def chat_completion(
    session_id: UUID,
    content: str,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(deps.get_current_user)
):
    result = await db.execute(select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == current_user.id))
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    user_msg = Message(session_id=session_id, role="user", content=content)
    db.add(user_msg)
    
    graph = build_graph()
    initial_state = {
        "archive_id": str(session.archive_id),
        "query": content,
        "messages": [{"role": "user", "content": content}],
        "context_sufficient": True,
        "last_summary": session.last_summary or "",
        "response_mode": current_user.settings.get("response_mode", "normal")
    }
    
    agent_result = await graph.ainvoke(initial_state)
    final_response = agent_result.get("final_response", "")
    new_summary = agent_result.get("last_summary")
    
    # 3. 保存 AI 消息
    ai_msg = Message(
        session_id=session_id, 
        role="assistant", 
        content=final_response,
        meta_data={"intent": agent_result.get("intent")}
    )
    db.add(ai_msg)
    
    if new_summary:
        session.last_summary = new_summary
        db.add(session)
        
    await db.commit()
    
    return {
        "content": final_response,
        "intent": agent_result.get("intent"),
        "needed_info": agent_result.get("needed_info")
    }

@router.get("/completions/stream")
async def chat_completion_stream(
    session_id: UUID,
    content: str,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(deps.get_current_user)
):
    result = await db.execute(select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == current_user.id))
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # 1. 保存用户消息
    user_msg = Message(session_id=session_id, role="user", content=content)
    db.add(user_msg)
    await db.commit()
    
    async def event_generator():
        graph = build_graph()
        initial_state = {
            "archive_id": str(session.archive_id),
            "query": content,
            "messages": [{"role": "user", "content": content}],
            "context_sufficient": True,
            "last_summary": session.last_summary or "",
            "response_mode": current_user.settings.get("response_mode", "normal")
        }
        
        full_content = ""
        new_summary = None
        
        # 使用 astream_events 来监听 LLM 的 token
        async for event in graph.astream_events(initial_state, version="v2"):
            kind = event["event"]
            
            # 1. 监听 LLM 流
            if kind == "on_chat_model_stream" and event["metadata"].get("langgraph_node") == "respond":
                content_chunk = event["data"]["chunk"].content
                if content_chunk:
                    full_content += content_chunk
                    yield f"data: {json.dumps({'content': content_chunk})}\n\n"
            
            # 2. 监听节点结束（用于获取 Mock 模式下的 final_response）
            elif kind == "on_chain_end" and event["name"] == "respond":
                if not full_content:
                    final_out = event["data"].get("output", {})
                    if isinstance(final_out, dict) and "final_response" in final_out:
                        full_content = final_out["final_response"]
                        for i in range(0, len(full_content), 5):
                            chunk = full_content[i:i+5]
                            yield f"data: {json.dumps({'content': chunk})}\n\n"
                            await asyncio.sleep(0.05)
            
            # 3. 监听摘要节点
            elif kind == "on_chain_end" and event["name"] == "summarize":
                final_out = event["data"].get("output", {})
                if isinstance(final_out, dict) and "last_summary" in final_out:
                    new_summary = final_out["last_summary"]
        
        # 4. 结束后保存完整消息到数据库
        ai_msg = Message(
            session_id=session_id, 
            role="assistant", 
            content=full_content
        )
        db.add(ai_msg)
        
        if new_summary:
            session.last_summary = new_summary
            db.add(session)
            
        await db.commit()
        
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(deps.get_current_user)
):
    # 1. 删除关联消息
    stmt_msgs = delete(Message).where(Message.session_id == session_id)
    await db.execute(stmt_msgs)
    
    # 2. 删除会话
    stmt_session = delete(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
    await db.execute(stmt_session)
    
    await db.commit()
    return {"message": "Session and messages deleted"}

@router.get("/sessions/{session_id}/facts")
async def get_session_facts(
    session_id: UUID,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(deps.get_current_user)
):
    session_res = await db.execute(select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == current_user.id))
    session = session_res.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    result = await db.execute(select(MemoryFact).where(MemoryFact.archive_id == session.archive_id))
    return result.scalars().all()

@router.delete("/facts/{fact_id}")
async def delete_fact(
    fact_id: UUID,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(deps.get_current_user)
):
    # 简单权限检查通过 archive 关联，此处演示从简
    stmt = delete(MemoryFact).where(MemoryFact.id == fact_id)
    await db.execute(stmt)
    await db.commit()
    return {"message": "Fact deleted"}
