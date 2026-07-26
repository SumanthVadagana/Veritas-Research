import json
from typing import Any, Dict, List, Optional


def format_sse_event(event_type: str, data: Dict[str, Any]) -> str:
    """Format a Server-Sent Event string according to SSE standard."""
    payload = json.dumps({"type": event_type, **data}, default=str)
    return f"data: {payload}\n\n"


def sse_status(phase: str, message: str, progress: float) -> str:
    """Stream progress update event."""
    return format_sse_event(
        "status",
        {
            "phase": phase,
            "message": message,
            "progress": round(progress, 2),
        },
    )


def sse_researcher(
    sub_queries: List[str],
    sources: List[Dict[str, Any]],
    claims: List[Dict[str, Any]],
) -> str:
    """Stream Researcher Agent findings event."""
    return format_sse_event(
        "researcher",
        {
            "sub_queries": sub_queries,
            "sources": sources,
            "claims": claims,
        },
    )


def sse_verifier(verified_claims: List[Dict[str, Any]]) -> str:
    """Stream Verifier Agent results event."""
    return format_sse_event(
        "verifier",
        {
            "verified_claims": verified_claims,
        },
    )


def sse_critic(critique: Dict[str, Any]) -> str:
    """Stream Critic Agent assessment event."""
    return format_sse_event(
        "critic",
        {
            "critique": critique,
        },
    )


def sse_final_report(
    synthesis: str,
    executive_summary: Optional[str],
    overall_confidence: float,
    claims: List[Dict[str, Any]],
    verified_answer: Optional[str] = None,
    explanation: Optional[str] = None,
    sources_used: Optional[List[Dict[str, Any]]] = None,
) -> str:
    """Stream Synthesizer Agent final report event."""
    return format_sse_event(
        "final_report",
        {
            "synthesis": synthesis,
            "executive_summary": executive_summary,
            "overall_confidence": overall_confidence,
            "claims": claims,
            "verified_answer": verified_answer or "",
            "explanation": explanation or executive_summary or "",
            "sources_used": sources_used or [],
        },
    )


def sse_agent_event(
    agent: str,
    event_type: str,
    message: str,
    metadata: Dict[str, Any] | None = None,
) -> str:
    """Legacy/granular agent event format."""
    return format_sse_event(
        "agent_event",
        {
            "agent": agent,
            "event_type": event_type,
            "message": message,
            "metadata": metadata or {},
        },
    )


def sse_citations(citations: list) -> str:
    return format_sse_event("citations", {"citations": citations})


def sse_fact_checks(fact_checks: list) -> str:
    return format_sse_event("fact_checks", {"fact_checks": fact_checks})


def sse_synthesis(synthesis: str, confidence: float) -> str:
    return format_sse_event("synthesis", {"synthesis": synthesis, "confidence": confidence})


def sse_complete(session_id: str) -> str:
    return format_sse_event("complete", {"session_id": session_id})


def sse_error(message: str) -> str:
    return format_sse_event("error", {"message": message})
