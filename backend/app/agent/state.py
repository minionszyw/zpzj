from typing import List, Dict, Any, TypedDict, Annotated
from operator import add

class AgentState(TypedDict):
    # 档案快照
    archive_id: str
    archive_config: Dict[str, Any]
    
    # 服务器当前时间 (时空感知层)
    server_time: str
    
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
    last_summary: str
    response_mode: str # normal, professional
    dialogue_depth: int
    
    # 最终输出
    final_response: str
