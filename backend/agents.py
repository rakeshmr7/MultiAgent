import os
import json
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from backend.config import settings
from backend.prompts import (
    DOMAIN_VALIDATION_PROMPT,
    RESEARCHER_PROMPT,
    WRITER_PROMPT,
    EDITOR_PROMPT,
)

# Apply LangSmith environment variables programmatically if provided
if settings.langchain_api_key:
    os.environ["LANGCHAIN_API_KEY"] = settings.langchain_api_key
    os.environ["LANGCHAIN_TRACING_V2"] = settings.langchain_tracing_v2
    os.environ["LANGCHAIN_PROJECT"] = settings.langchain_project

# Check if OpenAI API Key is missing or placeholder
is_mock_mode = not settings.openai_api_key or settings.openai_api_key.strip() in ["", "your_openai_api_key_here"]

if is_mock_mode:
    print("\n" + "!" * 50)
    print("WARNING: OPENAI_API_KEY is missing or placeholder.")
    print("Running in MOCK MODE for validation and report generation.")
    print("!" * 50 + "\n")
    llm_validator = None
    llm_researcher = None
    llm_writer = None
    llm_editor = None
else:
    os.environ["OPENAI_API_KEY"] = settings.openai_api_key
    llm_validator = ChatOpenAI(
        model=settings.openai_model,
        temperature=0.0,
        model_kwargs={"response_format": {"type": "json_object"}},
    )
    llm_researcher = ChatOpenAI(
        model=settings.openai_model,
        temperature=0.3,
    )
    llm_writer = ChatOpenAI(
        model=settings.openai_model,
        temperature=0.5,
    )
    llm_editor = ChatOpenAI(
        model=settings.openai_model,
        temperature=0.2,
    )

def run_domain_validation(query: str) -> dict:
    if is_mock_mode:
        # Simple domain verification rules for local mock tests
        query_lower = query.lower()
        # Reject topics containing non-technology words
        if any(word in query_lower for word in ["lasagna", "recipe", "cook", "food", "gardening", "sports"]):
            return {
                "is_valid": False,
                "reason": "Topic is outside the Technology Market Research domain. We only support tech companies, AI trends, cloud computing, cybersecurity, software engineering, or emerging technologies."
            }
        return {
            "is_valid": True,
            "reason": ""
        }

    messages = [
        SystemMessage(content=DOMAIN_VALIDATION_PROMPT),
        HumanMessage(content=f"Analyze this topic: {query}"),
    ]
    response = llm_validator.invoke(messages)
    try:
        return json.loads(response.content)
    except Exception as e:
        return {
            "is_valid": False,
            "reason": f"Failed to parse validator response: {str(e)}",
        }

def run_research(query: str) -> str:
    if is_mock_mode:
        return f"""# Research Notes: {query}
- Executive Findings: Compiled overview of {query} and its market landscape.
- Important Facts: Focuses on core technological shifts, market players, and adoption.
- Key Statistics: Growth rate expected at 24.5% CAGR over the next 5 years.
- References: Industry reports and technology frameworks.
- Bullet-Point Research Summary:
  * Major development phase in 2026.
  * Security and scalability are primary requirements.
  * Significant capital is flowing into this sector.
"""

    prompt = RESEARCHER_PROMPT.format(topic=query)
    messages = [
        HumanMessage(content=prompt),
    ]
    response = llm_researcher.invoke(messages)
    return response.content

def run_writer(query: str, notes: str) -> str:
    if is_mock_mode:
        return f"""# {query} Market Research Report

## Executive Summary
This report analyzes the market dynamics, architecture, and trends for {query}.

## Introduction
Technology has entered a new phase, with {query} playing a key role in industrial optimization.

## Background
Originating from research labs, {query} is now transitioning to enterprise-wide deployment.

## Analysis
The core mechanics rely on modular subsystems, data pipelines, and intelligent interfaces.

## Current Trends
Hyper-automation, zero-trust patterns, and specialized hardware accelerators dominate the space.

## Opportunities
Adopting this technology allows developers to reduce operational overhead by up to 40%.

## Challenges
Integration complexity, developer skill gaps, and evolving compliance landscapes present barriers.

## Recommendations
Organizations should establish sandboxes, invest in training, and phase deployments iteratively.

## Conclusion
The outlook for {query} is highly promising, with widespread convergence expected by 2028.
"""

    prompt = WRITER_PROMPT.format(topic=query)
    messages = [
        SystemMessage(content=prompt),
        HumanMessage(content=f"Here are the research notes to use:\n\n{notes}"),
    ]
    response = llm_writer.invoke(messages)
    return response.content

def run_editor(draft: str) -> str:
    if is_mock_mode:
        return draft + "\n\n*Note: Report reviewed and polished by the Editor Agent.*"

    messages = [
        SystemMessage(content=EDITOR_PROMPT),
        HumanMessage(content=f"Here is the draft report to edit:\n\n{draft}"),
    ]
    response = llm_editor.invoke(messages)
    return response.content
