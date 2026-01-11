from typing import List
from uuid import UUID
from datetime import datetime
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
from app.services.memory_service import MemoryService
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
    
    # 获取历史消息作为上下文
    depth = int(current_user.settings.get("depth", 10))
    history_res = await db.execute(
        select(Message)
        .where(Message.session_id == session_id)
        .order_by(Message.created_at.desc())
        .limit(depth * 2)
    )
    # 因为是用 desc 查的最近消息，需要反转回 asc 顺序给 LLM
    history_msgs = [{"role": m.role, "content": m.content} for m in reversed(history_res.scalars().all())]

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    archive = await ArchiveService.get(db, session.archive_id, current_user.id)

    graph = build_graph()
    initial_state = {
        "archive_id": str(session.archive_id),
        "archive_config": {
            "name": archive.name,
            "gender": archive.gender,
            "birth_time": archive.birth_time.strftime("%Y-%m-%d %H:%M:%S"),
            "calendar_type": archive.calendar_type,
            "lat": archive.lat,
            "lng": archive.lng
        },
        "server_time": now,
        "query": content,
        "messages": history_msgs + [{"role": "user", "content": content}],
        "context_sufficient": True,
        "last_summary": session.last_summary or "",
        "response_mode": current_user.settings.get("response_mode", "normal"),
        "dialogue_depth": int(current_user.settings.get("depth", 10))
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
    
    # 核心修复：使用 update 语句确保摘要更新生效
    if new_summary:
        from sqlalchemy import update
        await db.execute(
            update(ChatSession)
            .where(ChatSession.id == session_id)
            .values(last_summary=new_summary)
        )
        
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
    
    # 获取历史消息
    depth = int(current_user.settings.get("depth", 10))
    history_res = await db.execute(
        select(Message)
        .where(Message.session_id == session_id)
        .order_by(Message.created_at.desc())
        .limit(depth * 2)
    )
    history_msgs = [{"role": m.role, "content": m.content} for m in reversed(history_res.scalars().all())]

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    archive = await ArchiveService.get(db, session.archive_id, current_user.id)

    async def event_generator():
        graph = build_graph()
        initial_state = {
            "archive_id": str(session.archive_id),
            "archive_config": {
                "name": archive.name,
                "gender": archive.gender,
                "birth_time": archive.birth_time.strftime("%Y-%m-%d %H:%M:%S"),
                "calendar_type": archive.calendar_type,
                "lat": archive.lat,
                "lng": archive.lng
            },
            "server_time": now,
            "query": content,
            "messages": history_msgs,
            "context_sufficient": True,
            "last_summary": session.last_summary or "",
            "response_mode": current_user.settings.get("response_mode", "normal"),
            "dialogue_depth": int(current_user.settings.get("depth", 10))
        }
        
        full_content = ""
        new_summary = None
        intent = None
        
        async def save_to_db(f_content, n_summary, n_intent):
            if not f_content:
                return
            from app.db.session import get_async_session_maker
            SessionMaker = get_async_session_maker()
            async with SessionMaker() as bg_db:
                ai_msg = Message(
                    session_id=session_id, 
                    role="assistant", 
                    content=f_content,
                    meta_data={"intent": n_intent}
                )
                bg_db.add(ai_msg)
                if n_summary:
                    from sqlalchemy import update
                    await bg_db.execute(
                        update(ChatSession)
                        .where(ChatSession.id == session_id)
                        .values(last_summary=n_summary)
                    )
                await bg_db.commit()
                try:
                    full_history = history_msgs + [{"role": "assistant", "content": f_content}]
                    from app.services.knowledge_service import KnowledgeService
                    existing_facts = await KnowledgeService.retrieve_user_facts(session.archive_id, content, limit=20)
                    await MemoryService.extract_and_save_facts(bg_db, session.archive_id, full_history, existing_facts=existing_facts)
                except Exception as e:
                    print(f"Background memory extraction failed: {e}")

        queue = asyncio.Queue()
        
        async def run_graph():
            nonlocal full_content, new_summary, intent
            nodes_streamed = set()
            try:
                print(f"Starting optimized graph execution for session {session_id}")
                async for event in graph.astream_events(initial_state, version="v2"):
                    kind = event["event"]
                    name = event["name"]
                    metadata = event.get("metadata", {})
                    node_name = metadata.get("langgraph_node")
                    
                    if kind == "on_chat_model_stream" and node_name == "respond":
                        chunk = event["data"]["chunk"].content
                        if chunk:
                            nodes_streamed.add(node_name)
                            full_content += chunk
                            await queue.put(json.dumps({"content": chunk}))
                    
                    elif kind == "on_tool_start":
                        await queue.put(json.dumps({"status": "thinking", "message": "正在调动命理工具查询..."}))

                    elif kind == "on_chain_end" and (name == "respond" or node_name == "respond"):
                        final_out = event["data"].get("output", {})
                        if isinstance(final_out, dict) and "final_response" in final_out:
                            node_content = final_out["final_response"]
                            if node_content and node_name not in nodes_streamed:
                                await queue.put(json.dumps({"content": node_content}))
                                full_content += node_content
                                nodes_streamed.add(node_name)
                    
                    elif kind == "on_chain_end" and name == "intent":
                        final_out = event["data"].get("output", {})
                        if isinstance(final_out, dict):
                            intent = final_out.get("intent")
                    
                    elif kind == "on_chain_end" and name == "summarize":
                        final_out = event["data"].get("output", {})
                        if isinstance(final_out, dict) and "last_summary" in final_out:
                            new_summary = final_out["last_summary"]
                
                print(f"Graph finished. Saving content ({len(full_content)} chars).")
                await save_to_db(full_content, new_summary, intent)
            except Exception as e:
                import traceback
                traceback.print_exc()
                await queue.put(json.dumps({"error": f"处理错误: {str(e)}"}))
            finally:
                await queue.put("[DONE]")

        task = asyncio.create_task(run_graph())
        try:
            while True:
                data = await queue.get()
                if data == "[DONE]":
                    break
                yield f"data: {data}\n\n"
        except GeneratorExit:
            print(f"Client disconnected, session {session_id} will continue in background.")
        except Exception as e:
            print(f"Streaming error: {e}")
            task.cancel()

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
    facts = result.scalars().all()
    
    import numpy as np
    for fact in facts:
        if isinstance(fact.embedding, np.ndarray):
            fact.embedding = fact.embedding.tolist()
            
    return facts

@router.delete("/facts/{fact_id}")
async def delete_fact(
    fact_id: UUID,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(deps.get_current_user)
):
    stmt = delete(MemoryFact).where(MemoryFact.id == fact_id)
    await db.execute(stmt)
    await db.commit()
    return {"message": "Fact deleted"}
