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
    如果用户问事业，但没有提供目前的职业、学历等背景，则判定为上下文不充分。
    
    用户问题：{state['query']}
    已有事实记忆：{state.get('retrieved_facts', [])}
    
    请输出 JSON 格式：
    {{
        "intent": "维度名称",
        "context_sufficient": true/false,
        "needed_info": ["如果缺失，列出需要用户补充的信息"]
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