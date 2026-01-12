from langchain_openai import ChatOpenAI
from app.core.config import settings
from app.agent.state import AgentState
from app.services.bazi_service import BaziService
from app.agent.tools.fortune import query_fortune_details
import json
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, BaseMessage, ToolMessage
from langchain_core.runnables import RunnableConfig

async def respond_node(state: AgentState, config: RunnableConfig):
    # 绑定工具
    tools = [query_fortune_details]
    llm = ChatOpenAI(
        model=settings.LLM_MODEL,
        api_key=settings.LLM_API_KEY,
        base_url=settings.LLM_API_BASE,
        temperature=0, # 降低温度以提高工具调用稳定性
        streaming=True
    ).bind_tools(tools)
    
    # 核心数据精简
    full_bazi = state.get("bazi_result", {})
    essential_bazi = BaziService.get_essential_data(full_bazi) if full_bazi else {}
    bazi_json = json.dumps(essential_bazi, ensure_ascii=False)
    
    knowledge = state.get("retrieved_knowledge", [])
    facts = state.get("retrieved_facts", [])
    summary = state.get("last_summary", "")
    mode = state.get("response_mode", "normal")
    server_time = state.get("server_time", "未知")
    
    mode_instruction = ""
    if mode == "professional":
        mode_instruction = """
        当前处于【专业模式】：
        - 目标用户：专业命理师。
        - 表达风格：逻辑严密，学术氛围浓厚，深入剖析干支作用关系。
        - 格式要求：必须使用丰富的 Markdown 格式（标题、列表、引用、加粗）来增强可读性。
        - 内容要求：大幅增加对《渊海子平》等古籍原文的引用，展现推演过程。
        """
    else:
        mode_instruction = """
        当前处于【普通模式】：
        - 目标用户：普通小白用户。
        - 表达风格：像微信聊天一样自然、口语化，侧重于心理疏导、生活建议和最终结论。
        - 格式要求：【绝对禁止】使用任何 Markdown 格式（不要使用标题、加粗、列表、表格或 > 引用符号）。请直接输出纯文本。
        - 内容要求：简化回复逻辑，避免生僻术语，直接给结论。
        """

    # 交互式诊断逻辑增强
    diagnosis_instruction = ""
    if not state.get("context_sufficient", True):
        needed = ", ".join(state.get("needed_info", []))
        diagnosis_instruction = f"""
        【重要：交互式诊断模式】
        当前上下文信息不足以给出高质量分析。你需要明确列出需要用户补充的信息：{needed}。
        """

    # 工具使用指引
    tool_instruction = """
    【！！！核心指令：查询流年必须使用工具！！！】:
    1. 你手中的【核心命盘数据】中 fortune.da_yun 仅包含大运概览，没有任何具体的流年（Liu Nian）或流月（Liu Yue）详情。
    2. 如果用户询问特定年份（如 2025年、2026年、2027年等）的运势或回顾，你必须、必须、必须通过调用 `query_fortune_details` 工具来获取该年份的干支和流月详情。
    3. 即使该年份是过去或现在，也请调用工具获取准确的干支信息再进行分析。
    4. 严禁自行推算，严禁在未调用工具的情况下分析具体流年，严禁只给一段开场白而不调用工具。
    """

    # 策略：利用 Prompt Caching，强制置顶核心数据
    system_prompt = f"""
    你是一个专业的命理分析师“子平真君”。你基于《渊海子平》经典理论进行分析。
    
    {mode_instruction}
    {diagnosis_instruction}
    {tool_instruction}
    
    【服务器当前时间】:
    {server_time} (请以此时间为基准计算年龄、流年、流月，不要询问用户当前时间)
    
    【核心命盘数据】:
    {bazi_json}
    
    【已知事实】:
    {facts}
    
    【前情提提要】:
    {summary}
    
    【古籍参考】:
    {knowledge}
    
    分析准则：
    1. 计算与分析分离：严禁自行推算干支，必须以【核心命盘数据】为准。
    2. 如果当前模式是专业模式（基于用户偏好），请大幅增加对古籍原文的引用。
    """
    
    # 格式化消息历史，确保兼容字典和 BaseMessage 对象
    raw_messages = state.get("messages", [])
    formatted_messages = []
    for m in raw_messages:
        if isinstance(m, BaseMessage):
            formatted_messages.append(m)
        elif isinstance(m, dict):
            role = m.get("role")
            content = m.get("content")
            if role == "user":
                formatted_messages.append(HumanMessage(content=content))
            elif role == "assistant":
                formatted_messages.append(AIMessage(content=content, tool_calls=m.get("tool_calls", [])))
            elif role == "system":
                formatted_messages.append(SystemMessage(content=content))
            elif role == "tool":
                formatted_messages.append(ToolMessage(content=content, tool_call_id=m.get("tool_call_id")))
    
    messages = [SystemMessage(content=system_prompt)] + formatted_messages
    
    response = await llm.ainvoke(messages, config)
    
    return {
        "final_response": response.content,
        "messages": [response]
    }