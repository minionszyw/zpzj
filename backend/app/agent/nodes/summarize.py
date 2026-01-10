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
    depth = state.get("dialogue_depth", 10)
    
    # 当消息数量达到或超过设定深度时触发摘要
    if len(messages) < depth:
        return {}

    print(f"DEBUG: Triggering summarization for {len(messages)} messages (threshold: {depth})")
    
    llm = ChatOpenAI(
        model=settings.LLM_MODEL,
        api_key=settings.LLM_API_KEY,
        base_url=settings.LLM_API_BASE,
        temperature=0
    )
    
    # 格式化对话历史
    history_text = "\n".join([f"{m['role']}: {m['content']}" for m in messages])
    
    prompt = f"""
    请对以下对话历史进行简明扼要的摘要，保留关键的命理咨询信息和用户背景。
    直接输出摘要文本，不要包含任何前缀。
    
    {history_text}
    """
    
    response = await llm.ainvoke(prompt)
    return {"last_summary": response.content}
