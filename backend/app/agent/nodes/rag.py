import asyncio
from app.agent.state import AgentState
from app.services.knowledge_service import KnowledgeService
from uuid import UUID

async def rag_node(state: AgentState):
    """
    真实 RAG 节点：检索古籍知识与档案相关的事实记忆。
    """
    query = state["query"]
    archive_id = state["archive_id"]
    
    # 并发检索以提升性能
    knowledge_task = KnowledgeService.retrieve_ancient_books(query)
    facts_task = KnowledgeService.retrieve_user_facts(UUID(archive_id), query)
    
    knowledge, facts = await asyncio.gather(knowledge_task, facts_task)
    
    return {
        "retrieved_knowledge": knowledge,
        "retrieved_facts": facts
    }
