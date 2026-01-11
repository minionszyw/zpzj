from app.agent.state import AgentState
from app.services.memory_service import MemoryService
from app.db.session import get_async_session_maker
from uuid import UUID

async def memory_node(state: AgentState):
    """
    事实记忆提取节点：从当前对话中提取关于用户的长期事实。
    """
    archive_id = state["archive_id"]
    messages = state.get("messages", [])
    final_response = state.get("final_response", "")
    
    # 构造包含当前回答的完整消息列表
    full_messages = messages + [{"role": "assistant", "content": final_response}]
    
    if final_response:
        SessionLocal = get_async_session_maker()
        async with SessionLocal() as db:
            new_facts = await MemoryService.extract_and_save_facts(
                db, archive_id, full_messages, existing_facts=state.get("retrieved_facts", [])
            )
            return {"retrieved_facts": state.get("retrieved_facts", []) + new_facts}
    
    return {}