from langchain_openai import ChatOpenAI
from app.core.config import settings
from app.agent.state import AgentState

async def respond_node(state: AgentState):
    llm = ChatOpenAI(
        model=settings.LLM_MODEL,
        api_key=settings.LLM_API_KEY,
        base_url=settings.LLM_API_BASE,
        temperature=0.7
    )
    
    bazi_json = state.get("bazi_result", "{}")
    knowledge = state.get("retrieved_knowledge", [])
    facts = state.get("retrieved_facts", [])
    
    # 策略：利用 Prompt Caching，强制置顶核心数据
    system_prompt = f"""
    你是一个专业的命理分析师“子平真君”。你基于《渊海子平》经典理论进行分析。
    
    【核心命盘数据】:
    {bazi_json}
    
    【已知事实】:
    {facts}
    
    【古籍参考】:
    {knowledge}
    
    分析准则：
    1. 计算与分析分离：严禁自行推算干支，必须以【核心命盘数据】为准。
    2. 如果当前模式是专业模式（基于用户偏好），请大幅增加对古籍原文的引用。
    3. 如果意图不是“综合”分析，或者上下文不足，请侧重于引导用户补充背景信息。
    """
    
    messages = [
        {"role": "system", "content": system_prompt}
    ] + state["messages"]
    
    response = await llm.ainvoke(messages)
    
    return {"final_response": response.content}