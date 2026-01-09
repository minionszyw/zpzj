from app.agent.state import AgentState
from app.services.memory_service import MemoryService
from uuid import UUID

async def memory_node(state: AgentState):
    """
    事实记忆提取节点：从当前对话中提取关于用户的长期事实。
    """
    archive_id = state["archive_id"]
    query = state["query"]
    final_response = state.get("final_response", "")
    
    if final_response:
        # 实际生产中可以考虑作为后台任务运行，这里为了链路完整先同步调用
        new_facts = await MemoryService.extract_and_save_facts(
            UUID(archive_id), query, final_response
        )
        return {"retrieved_facts": state.get("retrieved_facts", []) + new_facts}
    
    return {}
