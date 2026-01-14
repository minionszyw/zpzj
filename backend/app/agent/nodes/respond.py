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
    
    # 1. 核心数据准备 (主命盘)
    full_bazi = state.get("bazi_result", {})
    essential_bazi = BaziService.get_essential_data(full_bazi) if full_bazi else {}
    bazi_json = json.dumps(essential_bazi, ensure_ascii=False)
    
    # 2. 关联人员命盘准备
    related_bazi_data = []
    related_results = state.get("related_bazi_results", {})
    if related_results:
        for rid, r_full in related_results.items():
            r_essential = BaziService.get_essential_data(r_full)
            # 查找姓名
            r_name = "未知人员"
            for a in state.get("user_archives", []):
                if a["id"] == rid:
                    r_name = f"{a['name']} ({a['relation'] or '相关人员'})"
                    break
            related_bazi_data.append({"name": r_name, "data": r_essential})
    
    related_json = json.dumps(related_bazi_data, ensure_ascii=False) if related_bazi_data else "无"

    knowledge = state.get("retrieved_knowledge", [])
    facts = state.get("retrieved_facts", [])
    summary = state.get("last_summary", "")
    mode = state.get("response_mode", "normal")
    server_time = state.get("server_time", "未知")
    
    mode_instruction = ""
    if mode == "professional":
        mode_instruction = """
        【模式指令：专业模式】
        - 目标用户：专业命理师或命理研究者。
        - 表达风格：严谨、学术、逻辑性极强。
        - 核心结构：必须包含明确的【推演逻辑】部分。
        - 推演要求：
            1. **依据命盘**：明确指出分析所引用的具体干支、十神、五行能量或神煞数据。
            2. **引用古籍**：必须结合《渊海子平》等古籍原文作为理论支撑，并解释其在当前命盘中的适用性。
            3. **分析方法**：说明你采用了何种分析体系（如：子平格局法、用神分析、干支作用关系、病药说等）。
            4. **得出结论**：展示从原始数据到古籍论证，再到最终推导结论的完整逻辑链条。
        - 格式要求：必须使用丰富的 Markdown 格式（## 标题、### 小标题、- 列表、> 引用、**加粗**）来增强层次感。
        """
    else:
        mode_instruction = """
        【模式指令：普通模式】
        - 目标用户：普通小白用户。
        - 表达风格：像微信聊天一样自然、随性、口语化。侧重于心理疏导、生活建议和直白结论。
        - 格式要求：【严重警告：绝对禁止使用 Markdown】。不要使用 # 标题、** 加粗、- 列表、| 表格或 > 引用。请直接输出纯文本。不要使用分点叙述，请用自然的段落。
        - 内容要求：简化回复逻辑，不要解释干支术语，直接说结果。哪怕对话历史中之前使用了 Markdown，你也必须立即停止使用，改为纯文本。
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
    {server_time}
    
    【核心主命盘数据】:
    {bazi_json}
    
    【关联人员命盘数据】:
    {related_json}
    
    【已知事实】:
    {facts}
    
    【前情提提要】:
    {summary}
    
    【古籍参考 (仅提取知识，严禁模仿其 Markdown 格式)】:
    {knowledge}
    
    分析准则：
    1. 计算与分析分离：严禁自行推算干支，必须以上述命盘数据为准。
    2. 数据优先级：如果【关联人员命盘数据】中的信息与【已知事实】冲突，请以【关联人员命盘数据】为准，因为它是基于档案系统实时生成的。
    3. 完备性：如果提供了【关联人员命盘数据】，说明该人员的性别、出生时间、出生地点等信息已在系统中完整登记，请直接分析，【严禁】再询问用户该人员的基础信息。
    4. 多盘分析：如果提供了【关联人员命盘数据】，且用户问题涉及两人关系（如合婚、情感、合作），请进行对比分析。重点关注两盘干支的合冲克害、五行补给以及性格契合度。
    5. 模式一致性：严格遵守上述【模式指令】。如果当前是普通模式，必须输出没有任何 Markdown 符号的纯文本。
    6. 风格切换：如果历史消息风格与当前指令不符，请以当前指令为准，立即切换风格。
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