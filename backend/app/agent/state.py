from typing import List, Dict, Any, TypedDict, Annotated
from operator import add

class AgentState(TypedDict):
    # 档案快照
    archive_id: str
    archive_config: Dict[str, Any]
    
    # 原始查询
    query: str
    
    # 意图与上下文充分性
    intent: str
    context_sufficient: bool
    needed_info: List[str]
    
    # 计算结果
    bazi_result: Dict[str, Any]
    
    # 知识检索
    retrieved_knowledge: List[str]
    retrieved_facts: List[str]
    
    # 对话历史
    messages: Annotated[List[Dict[str, str]], add]
    
    # 最终输出
    final_response: str
