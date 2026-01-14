from typing import List, Dict, Any, TypedDict, Annotated
from operator import add

class AgentState(TypedDict):
    # 档案快照
    archive_id: str
    archive_config: Dict[str, Any]
    
    # 用户的全部档案列表 (用于跨盘分析检索)
    user_archives: List[Dict[str, Any]]
    
    # 服务器当前时间 (时空感知层)
    server_time: str
    
    # 原始查询
    query: str
    
    # 意图与上下文充分性
    intent: str
    context_sufficient: bool
    needed_info: List[str]
    related_archive_ids: List[str] # 识别到的相关人员 ID
    
    # 计算结果
    bazi_result: Dict[str, Any]
    related_bazi_results: Dict[str, Dict[str, Any]] # 相关人员的计算结果
    
    # 知识检索
    retrieved_knowledge: List[str]
    retrieved_facts: List[str]
    
    # 对话历史 (兼容字典格式和 LangChain 消息对象)
    messages: Annotated[list, add]
    last_summary: str
    response_mode: str # normal, professional
    dialogue_depth: int
    
    # 最终输出
    final_response: str
