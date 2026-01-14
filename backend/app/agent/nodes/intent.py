import json
from langchain_openai import ChatOpenAI
from app.core.config import settings
from app.agent.state import AgentState

async def intent_node(state: AgentState):
    user_archives = state.get("user_archives", [])
    
    llm = ChatOpenAI(
        model=settings.LLM_MODEL,
        api_key=settings.LLM_API_KEY,
        base_url=settings.LLM_API_BASE,
        temperature=0
    )
    
    # 提取档案库中的简要信息供 LLM 匹配
    archives_context = json.dumps(user_archives, ensure_ascii=False)
    
    prompt = f"""
    你是一个命理意图识别专家。根据用户的提问，判断用户的咨询意图、上下文是否充分，并识别是否涉及档案库中的其他人。
    
    咨询维度包括：财运、事业、感情、健康、学业、综合。
    
    【当前主档案信息】:
    {state.get('archive_config')}
    
    【用户档案库列表】:
    {archives_context}
    
    【已有事实记忆】:
    {state.get('retrieved_facts', [])}
    
    判断逻辑：
    1. 意图识别：判断用户想问什么维度。
    2. 数据充分性：
       - 如果【当前主档案信息】已包含姓名、性别、出生时间等，则“核心命盘数据”充分。
       - 如果用户问特定维度但缺乏背景（如问事业但没说职业），则“业务上下文”不充分。
    3. 相关人员识别：
       - 检查用户问题是否提到了档案库中的其他人（通过姓名或关系，如“我老婆”、“李四”）。
       - 如果提到了，且该人在【用户档案库列表】中，请记录其 EXACT ID。
       - 如果用户提到某人但档案库中没有，不要强行匹配。
    
    示例：
    用户档案库列表：[{{"id": "uuid-1", "name": "李四", "relation": "老婆"}}]
    用户问题：“结合我老婆的命盘分析”
    输出：{{"intent": "感情", "context_sufficient": true, "needed_info": [], "related_archive_ids": ["uuid-1"]}}
    
    用户问题：{state['query']}
    
    请输出 JSON 格式：
    {{
        "intent": "维度名称",
        "context_sufficient": true/false,
        "needed_info": ["需要补充的信息"],
        "related_archive_ids": ["匹配到的档案 ID 列表"]
    }}
    """
    
    response = await llm.ainvoke(prompt)
    try:
        # 简单的 JSON 提取逻辑
        result = json.loads(response.content.strip("```json").strip())
    except:
        result = {
            "intent": "综合",
            "context_sufficient": True,
            "needed_info": [],
            "related_archive_ids": []
        }
        
    return {
        "intent": result.get("intent", "综合"),
        "context_sufficient": result.get("context_sufficient", True),
        "needed_info": result.get("needed_info", []),
        "related_archive_ids": result.get("related_archive_ids", [])
    }
