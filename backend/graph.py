from langgraph.graph import StateGraph, END
from backend.state import GraphState
from backend.agents import (
    run_domain_validation,
    run_research,
    run_writer,
    run_editor,
)

# Node implementation
def validate_topic_node(state: GraphState) -> dict:
    query = state["user_query"]
    # Perform validation
    validation = run_domain_validation(query)
    
    if not validation.get("is_valid", False):
        reason = validation.get("reason", "Topic is outside the Technology Market Research domain.")
        return {
            "status": "failed",
            "errors": [reason]
        }
    
    return {
        "status": "researching"
    }

def research_node(state: GraphState) -> dict:
    if state.get("status") == "failed":
        return {}
        
    query = state["user_query"]
    notes = run_research(query)
    return {
        "research_notes": notes,
        "status": "writing"
    }

def writer_node(state: GraphState) -> dict:
    if state.get("status") == "failed":
        return {}
        
    query = state["user_query"]
    notes = state["research_notes"]
    draft = run_writer(query, notes)
    return {
        "draft_report": draft,
        "status": "editing"
    }

def editor_node(state: GraphState) -> dict:
    if state.get("status") == "failed":
        return {}
        
    draft = state["draft_report"]
    final = run_editor(draft)
    return {
        "final_report": final,
        "status": "completed"
    }

# Build workflow graph
workflow = StateGraph(GraphState)

# Add nodes
workflow.add_node("validator", validate_topic_node)
workflow.add_node("researcher", research_node)
workflow.add_node("writer", writer_node)
workflow.add_node("editor", editor_node)

# Entry point
workflow.set_entry_point("validator")

# Conditional routing functions
def route_validator(state: GraphState):
    if state.get("status") == "failed":
        return END
    return "researcher"

def route_researcher(state: GraphState):
    if state.get("status") == "failed":
        return END
    return "writer"

def route_writer(state: GraphState):
    if state.get("status") == "failed":
        return END
    return "editor"

# Add edges with routers
workflow.add_conditional_edges("validator", route_validator)
workflow.add_conditional_edges("researcher", route_researcher)
workflow.add_conditional_edges("writer", route_writer)
workflow.add_edge("editor", END)

# Compile graph
graph = workflow.compile()
