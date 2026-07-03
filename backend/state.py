from typing import TypedDict, List, Optional

class GraphState(TypedDict):
    user_query: str
    research_notes: Optional[str]
    draft_report: Optional[str]
    final_report: Optional[str]
    status: str  # e.g., "validating", "researching", "writing", "editing", "completed", "failed"
    errors: Optional[List[str]]
