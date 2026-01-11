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
    history_res = await db.execute(
        select(Message).where(Message.session_id == session_id).order_by(Message.created_at.asc())
    )
    history_msgs = [{"role": m.role, "content": m.content} for m in history_res.scalars().all()]

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
    history_res = await db.execute(
        select(Message).where(Message.session_id == session_id).order_by(Message.created_at.asc())
    )
    history_msgs = [{"role": m.role, "content": m.content} for m in history_res.scalars().all()]

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
        
        # 定义一个函数用于最终保存数据，以便在正常结束或连接断开时都能被调用
        async def save_to_db(f_content, n_summary, n_intent):
            if not f_content:
                return
            
            # 使用独立的 session 确保保存操作不受主请求生命周期影响
            from app.db.session import get_async_session_maker
            SessionMaker = get_async_session_maker()
            async with SessionMaker() as bg_db:
                # 保存 AI 回复
                ai_msg = Message(
                    session_id=session_id, 
                    role="assistant", 
                    content=f_content,
                    meta_data={"intent": n_intent}
                )
                bg_db.add(ai_msg)
                
                # 更新会话摘要
                if n_summary:
                    from sqlalchemy import update
                    await bg_db.execute(
                        update(ChatSession)
                        .where(ChatSession.id == session_id)
                        .values(last_summary=n_summary)
                    )
                
                await bg_db.commit()
                
                # 提取并保存记忆
                try:
                    full_history = history_msgs + [{"role": "assistant", "content": f_content}]
                    from app.services.knowledge_service import KnowledgeService
                    existing_facts = await KnowledgeService.retrieve_user_facts(session.archive_id, content, limit=20)
                    await MemoryService.extract_and_save_facts(bg_db, session.archive_id, full_history, existing_facts=existing_facts)
                except Exception as e:
                    print(f"Background memory extraction failed: {e}")

        # 核心逻辑封装，支持在 GeneratorExit 时继续运行
        queue = asyncio.Queue()
        
        async def run_graph():
            nonlocal full_content, new_summary, intent
            # 记录上一次 respond 节点结束时的内容，用于避免重复发送
            last_node_content = ""
            
            try:
                print(f"Starting graph execution for session {session_id}")
                async for event in graph.astream_events(initial_state, version="v2"):
                    kind = event["event"]
                    name = event["name"]
                    metadata = event.get("metadata", {})
                    node = metadata.get("langgraph_node")
                    
                    if kind == "on_chat_model_stream" and node == "respond":
                        chunk = event["data"]["chunk"].content
                        if chunk:
                            full_content += chunk
                            await queue.put(json.dumps({"content": chunk}))
                    
                    elif kind == "on_tool_start":
                        print(f"--- Tool execution started: {name} ---")
                        await queue.put(json.dumps({"status": "thinking", "message": "正在调动命理工具查询..."}))

                    elif kind == "on_tool_end":
                        print(f"--- Tool execution finished: {name} ---")

                    elif kind == "on_chain_end" and (name == "respond" or node == "respond"):
                        final_out = event["data"].get("output", {})
                        if isinstance(final_out, dict) and "final_response" in final_out:
                            node_content = final_out["final_response"]
                            if node_content:
                                print(f"--- Respond node finished. Content length: {len(node_content)} ---")
                                # 只有在没有通过 stream 发送过完全相同内容时才发送
                                if node_content != last_node_content:
                                    if not full_content.endswith(node_content):
                                        await queue.put(json.dumps({"content": node_content}))
                                        full_content += node_content
                                    last_node_content = node_content
                    
                    elif kind == "on_chain_end" and name == "intent":
                        final_out = event["data"].get("output", {})
                        if isinstance(final_out, dict):
                            intent = final_out.get("intent")
                    
                    elif kind == "on_chain_end" and name == "summarize":
                        final_out = event["data"].get("output", {})
                        if isinstance(final_out, dict) and "last_summary" in final_out:
                            new_summary = final_out["last_summary"]
                
                print(f"Graph execution completed. Saving {len(full_content)} chars.")
                await save_to_db(full_content, new_summary, intent)
            except Exception as e:
                import traceback
                traceback.print_exc()
                print(f"Graph execution error: {e}")
                await queue.put(json.dumps({"error": f"内部处理错误: {str(e)}"}))
            finally:
                await queue.put("[DONE]")

        # 启动后台任务运行 Graph
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
    
    # 处理 numpy 向量序列化问题
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
    # 简单权限检查通过 archive 关联，此处演示从简
    stmt = delete(MemoryFact).where(MemoryFact.id == fact_id)
    await db.execute(stmt)
    await db.commit()
    return {"message": "Fact deleted"}
