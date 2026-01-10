import json
from langchain_openai import ChatOpenAI
from app.core.config import settings
from app.agent.state import AgentState

async def intent_node(state: AgentState):
    llm = ChatOpenAI(
        model=settings.LLM_MODEL,
        api_key=settings.LLM_API_KEY,
        base_url=settings.LLM_API_BASE,
        temperature=0
    )
    
    prompt = f"""
    你是一个命理意图识别专家。根据用户的提问，判断用户的咨询意图以及上下文是否充分。
    
    咨询维度包括：财运、事业、感情、健康、学业、综合。
    
    【当前档案信息】:
    {state.get('archive_config')}
    
    【已有事实记忆】:
    {state.get('retrieved_facts', [])}
    
    判断逻辑：
    1. 如果【当前档案信息】中已经包含了姓名、性别、出生时间等核心数据，则认为“核心命盘数据”已充分。
    2. 如果用户问事业，但没有提供目前的职业、学历等背景（且【已有事实记忆】中也没有），则判定为“业务上下文”不充分，需要引导用户补充这些非命盘信息。
    
    用户问题：{state['query']}
    
    请输出 JSON 格式：
    {{
        "intent": "维度名称",
        "context_sufficient": true/false,
        "needed_info": ["如果缺失，列出需要用户补充的信息。如果核心命盘已在档案中，不要再要求出生时间。"]
    }}
    """
    
    response = await llm.ainvoke(prompt)
    try:
        # 简单的 JSON 提取逻辑，实际应用中建议使用 Pydantic Output Parser
        result = json.loads(response.content.strip("```json").strip())
    except:
        result = {
            "intent": "综合",
            "context_sufficient": True,
            "needed_info": []
        }
        
    return {
        "intent": result["intent"],
        "context_sufficient": result["context_sufficient"],
        "needed_info": result["needed_info"]
    }
