from langgraph.graph import StateGraph, END
from app.agent.state import AgentState
from app.agent.nodes.intent import intent_node
from app.agent.nodes.calculate import calculate_node
from app.agent.nodes.respond import respond_node
from app.agent.nodes.memory import memory_node
from app.agent.nodes.rag import rag_node
from app.agent.nodes.summarize import summarize_node

def should_continue(state: AgentState):
    if not state["context_sufficient"]:
        return "respond"
    return "calculate"

def build_graph():
    workflow = StateGraph(AgentState)
    
    workflow.add_node("intent", intent_node)
    workflow.add_node("calculate", calculate_node)
    workflow.add_node("rag", rag_node)
    workflow.add_node("respond", respond_node)
    workflow.add_node("memory", memory_node)
    workflow.add_node("summarize", summarize_node)
    
    workflow.set_entry_point("intent")
    
    workflow.add_conditional_edges(
        "intent",
        should_continue,
        {
            "respond": "respond",
            "calculate": "calculate"
        }
    )
    
    workflow.add_edge("calculate", "rag")
    workflow.add_edge("rag", "respond")
    workflow.add_edge("respond", "memory")
    workflow.add_edge("memory", "summarize")
    workflow.add_edge("summarize", END)
    
    return workflow.compile()