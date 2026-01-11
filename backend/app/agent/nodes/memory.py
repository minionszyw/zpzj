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

    

    # 直接使用 state 中的 messages，它已经包含了最新的回答

    # 注意：MemoryService 内部现在已经兼容了消息对象和字典

    if messages:

        SessionLocal = get_async_session_maker()

        async with SessionLocal() as db:

            new_facts = await MemoryService.extract_and_save_facts(

                db, archive_id, messages, existing_facts=state.get("retrieved_facts", [])

            )

            return {"retrieved_facts": state.get("retrieved_facts", []) + new_facts}

    

    return {}
