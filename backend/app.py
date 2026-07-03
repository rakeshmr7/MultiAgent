import time
import json
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from backend.graph import graph
from backend.config import settings

app = FastAPI(
    title="Multi-Agent Technology Market Research API",
    description="FastAPI service for generating technology market research reports using LangGraph.",
    version="1.0.0",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual frontend origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ReportRequest(BaseModel):
    topic: str

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "openai_configured": bool(settings.openai_api_key),
        "langsmith_configured": bool(settings.langchain_api_key),
    }

@app.post("/generate-report")
async def generate_report(payload: ReportRequest):
    """
    Synchronous endpoint that runs the entire multi-agent LangGraph workflow
    and returns the final polished report.
    """
    if not payload.topic.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Topic cannot be empty."
        )

    start_time = time.time()
    initial_state = {
        "user_query": payload.topic,
        "research_notes": None,
        "draft_report": None,
        "final_report": None,
        "status": "validating",
        "errors": None
    }
    
    try:
        final_state = await graph.ainvoke(initial_state)
        elapsed = time.time() - start_time
        execution_time = f"{round(elapsed, 2)}s"
        
        if final_state.get("status") == "failed":
            errors = final_state.get("errors", ["Topic outside technology domain."])
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=errors[0]
            )
            
        return {
            "status": "completed",
            "report": final_state.get("final_report"),
            "execution_time": execution_time,
            "agents": ["Researcher", "Writer", "Editor"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during report generation: {str(e)}"
        )

@app.post("/generate-report/stream")
async def generate_report_stream(payload: ReportRequest):
    """
    Streaming endpoint using Server-Sent Events (SSE) to send real-time
    progress updates from each agent in the LangGraph workflow.
    """
    if not payload.topic.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Topic cannot be empty."
        )

    async def event_generator():
        start_time = time.time()
        
        # 1. Starting Validation
        yield f"data: {json.dumps({'event': 'status', 'status': 'validating', 'message': 'Validating report topic domain...', 'elapsed': 0.0})}\n\n"
        
        initial_state = {
            "user_query": payload.topic,
            "research_notes": None,
            "draft_report": None,
            "final_report": None,
            "status": "validating",
            "errors": None
        }
        
        try:
            current_status = "validating"
            async for chunk in graph.astream(initial_state):
                elapsed = round(time.time() - start_time, 2)
                
                # chunk looks like: {'validator': {'status': 'researching'}}
                node_name = list(chunk.keys())[0]
                node_output = chunk[node_name]
                
                if "status" in node_output:
                    current_status = node_output["status"]
                
                if current_status == "failed":
                    errors = node_output.get("errors", ["Topic outside technology domain."])
                    yield f"data: {json.dumps({'event': 'failed', 'status': 'failed', 'errors': errors, 'elapsed': elapsed})}\n\n"
                    return
                
                # Format messages for progress logs
                if node_name == "validator":
                    yield f"data: {json.dumps({'event': 'status', 'status': 'researching', 'message': '✓ Topic validated. Researcher agent starting search...', 'elapsed': elapsed})}\n\n"
                elif node_name == "researcher":
                    yield f"data: {json.dumps({'event': 'status', 'status': 'writing', 'message': '✓ Research briefing generated. Writer agent drafting report...', 'elapsed': elapsed})}\n\n"
                elif node_name == "writer":
                    yield f"data: {json.dumps({'event': 'status', 'status': 'editing', 'message': '✓ Draft report created. Editor agent refining content...', 'elapsed': elapsed})}\n\n"
                elif node_name == "editor":
                    final_report = node_output.get("final_report", "")
                    yield f"data: {json.dumps({'event': 'completed', 'status': 'completed', 'message': '✓ Editor finished polishing. Final report ready.', 'report': final_report, 'elapsed': elapsed, 'agents': ['Researcher', 'Writer', 'Editor']})}\n\n"
                    return
                    
        except Exception as e:
            elapsed = round(time.time() - start_time, 2)
            yield f"data: {json.dumps({'event': 'failed', 'status': 'failed', 'errors': [str(e)], 'elapsed': elapsed})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app:app", host=settings.host, port=settings.port, reload=True)
