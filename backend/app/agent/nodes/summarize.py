from langchain_openai import ChatOpenAI
from app.core.config import settings
from app.agent.state import AgentState
from app.db.session import get_async_session_maker
from app.models.chat import ChatSession
from uuid import UUID
from sqlalchemy.future import select

async def summarize_node(state: AgentState):
    """
    摘要节点：当消息数量超过阈值时，对历史消息进行摘要。
    """
    messages = state.get("messages", [])
    # 假设我们设置阈值为 10 条消息 (5 轮对话)
    if len(messages) <= 10:
        return {}

    llm = ChatOpenAI(
        model=settings.LLM_MODEL,
        api_key=settings.LLM_API_KEY,
        base_url=settings.LLM_API_BASE,
        temperature=0
    )
    
    # 获取需要摘要的历史
    history_to_summarize = messages[:-4] # 保留最近 4 条
    
    prompt = f"""
    请对以下对话历史进行简明扼要的摘要，保留关键的命理咨询信息和用户背景：
    
    {history_to_summarize}
    
    摘要：
    """
    
    response = await llm.ainvoke(prompt)
    summary = response.content
    
    # 持久化摘要到数据库 (可选，也可在 API 层处理)
    # 这里我们只返回状态，由 graph 的后续或 API 层更新 DB
    
    return {"last_summary": summary}
