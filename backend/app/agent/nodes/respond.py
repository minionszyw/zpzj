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
    summary = state.get("last_summary", "")
    mode = state.get("response_mode", "normal")
    server_time = state.get("server_time", "未知")
    
    mode_instruction = ""
    if mode == "professional":
        mode_instruction = "当前处于【专业模式】：请大幅增加对古籍原文的引用，使用专业术语进行深入剖析干支作用关系。"
    else:
        mode_instruction = "当前处于【普通模式】：请使用通俗易懂的语言，侧重于心理疏导和行动建议，避免过多的生僻术语。"

    # 交互式诊断逻辑增强
    diagnosis_instruction = ""
    if not state.get("context_sufficient", True):
        needed = ", ".join(state.get("needed_info", []))
        diagnosis_instruction = f"""
        【重要：交互式诊断模式】
        当前上下文信息不足以给出高质量分析。你需要：
        1. 礼貌地告知用户，为了提供更精准的{state.get('intent', '分析')}，需要了解更多背景信息。
        2. 解释为什么这些信息重要（例如：事业分析需要结合当下的职业环境来判断先天格局如何落地）。
        3. 明确列出需要用户补充的信息：{needed}。
        4. 在用户补充前，不要进行深度推演，仅做初步的命理解读。
        """

    # 策略：利用 Prompt Caching，强制置顶核心数据
    system_prompt = f"""
    你是一个专业的命理分析师“子平真君”。你基于《渊海子平》经典理论进行分析。
    
    {mode_instruction}
    {diagnosis_instruction}
    
    【服务器当前时间】:
    {server_time} (请以此时间为基准计算年龄、流年、流月，不要询问用户当前时间)
    
    【核心命盘数据】:
    {bazi_json}
    
    【已知事实】:
    {facts}
    
    【前情提要】:
    {summary}
    
    【古籍参考】:
    {knowledge}
    
    分析准则：
    1. 计算与分析分离：严禁自行推算干支，必须以【核心命盘数据】为准。
    2. 如果当前模式是专业模式（基于用户偏好），请大幅增加对古籍原文的引用。
    3. 如果正处于“交互式诊断模式”，请严格遵守该模式的引导指令。
    """
    
    messages = [
        {"role": "system", "content": system_prompt}
    ] + state["messages"]
    
    response = await llm.ainvoke(messages)
    
    return {
        "final_response": response.content,
        "messages": [{"role": "assistant", "content": response.content}]
    }
