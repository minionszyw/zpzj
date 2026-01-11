from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from app.agent.state import AgentState
from app.agent.nodes.intent import intent_node
from app.agent.nodes.calculate import calculate_node
from app.agent.nodes.respond import respond_node
from app.agent.nodes.memory import memory_node
from app.agent.nodes.rag import rag_node
from app.agent.nodes.summarize import summarize_node
from app.agent.tools.fortune import query_fortune_details

# 定义工具集
tools = [query_fortune_details]
tool_node = ToolNode(tools)

def should_continue(state: AgentState):
    if not state["context_sufficient"]:
        return "respond"
    return "calculate"

def after_respond(state: AgentState):
    # 检查最后一条消息是否有 tool_calls
    messages = state.get("messages", [])
    if messages and hasattr(messages[-1], "tool_calls") and messages[-1].tool_calls:
        return "tools"
    # 如果最后一条消息是 dict 格式（旧格式兼容）
    last_msg = messages[-1] if messages else {}
    if isinstance(last_msg, dict) and last_msg.get("tool_calls"):
         return "tools"
    return "memory"

def build_graph():
    workflow = StateGraph(AgentState)
    
    workflow.add_node("rag", rag_node)
    workflow.add_node("intent", intent_node)
    workflow.add_node("calculate", calculate_node)
    workflow.add_node("respond", respond_node)
    workflow.add_node("tools", tool_node)
    workflow.add_node("memory", memory_node)
    workflow.add_node("summarize", summarize_node)
    
    workflow.set_entry_point("rag")
    
    workflow.add_edge("rag", "intent")
    
    workflow.add_conditional_edges(
        "intent",
        should_continue,
        {
            "respond": "respond",
            "calculate": "calculate"
        }
    )
    
    workflow.add_edge("calculate", "respond")
    
    workflow.add_conditional_edges(
        "respond",
        after_respond,
        {
            "tools": "tools",
            "memory": "memory"
        }
    )
    
    workflow.add_edge("tools", "respond")
    workflow.add_edge("memory", "summarize")
    workflow.add_edge("summarize", END)
    
    return workflow.compile()