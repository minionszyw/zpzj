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
    
    # 当消息数量达到或超过设定深度（轮数 * 2）时触发摘要
    if len(messages) < (depth * 2):
        return {}

    print(f"DEBUG: Triggering summarization for {len(messages)} messages (threshold: {depth * 2})")
    
    llm = ChatOpenAI(
        model=settings.LLM_MODEL,
        api_key=settings.LLM_API_KEY,
        base_url=settings.LLM_API_BASE,
        temperature=0
    )
    
    # 格式化对话历史 (兼容字典和 BaseMessage)
    history_parts = []
    for m in messages:
        if isinstance(m, dict):
            role = m.get("role", "unknown")
            content = m.get("content", "")
            history_parts.append(f"{role}: {content}")
        else:
            # LangChain BaseMessage 对象
            role = getattr(m, "type", "unknown")
            content = getattr(m, "content", "")
            history_parts.append(f"{role}: {content}")
            
    history_text = "\n".join(history_parts)
    
    prompt = f"""
    请对以下对话历史进行简明扼要的摘要，保留关键的命理咨询信息和用户背景。
    直接输出摘要文本，不要包含任何前缀。
    
    {history_text}
    """
    
    response = await llm.ainvoke(prompt)
    return {"last_summary": response.content}
