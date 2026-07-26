from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import ResearchSession
from app.schemas import SessionRead, SessionSummary

router = APIRouter(tags=["history"])


@router.get("/history", response_model=List[SessionSummary])
async def get_history(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """Paginated list of research sessions, newest first."""
    result = await db.execute(
        select(ResearchSession)
        .order_by(desc(ResearchSession.created_at))
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()


@router.get("/sessions/{session_id}", response_model=SessionRead)
async def get_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Full session detail with agent outputs, sources, claims, and final report."""
    result = await db.execute(
        select(ResearchSession)
        .where(ResearchSession.id == session_id)
        .options(
            selectinload(ResearchSession.user),
            selectinload(ResearchSession.agent_outputs),
            selectinload(ResearchSession.sources),
            selectinload(ResearchSession.claims),
            selectinload(ResearchSession.final_report),
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.get("/sessions/{session_id}/pdf")
async def download_session_pdf(
    session_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Generate and return downloadable PDF report for a research session."""
    from fastapi import Response
    from app.utils.pdf_generator import generate_report_pdf

    result = await db.execute(
        select(ResearchSession)
        .where(ResearchSession.id == session_id)
        .options(
            selectinload(ResearchSession.sources),
            selectinload(ResearchSession.claims),
            selectinload(ResearchSession.final_report),
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session_data = {
        "id": session.id,
        "query": session.query,
        "created_at": session.created_at.strftime("%Y-%m-%d %H:%M UTC") if session.created_at else "",
        "confidence_score": session.confidence_score,
        "final_report": {
            "synthesis": session.final_report.synthesis if session.final_report else "",
            "confidence_score": session.final_report.confidence_score if session.final_report else session.confidence_score,
        },
        "claims": [
            {
                "claim_text": c.claim_text,
                "verdict": c.verdict,
                "confidence_score": c.confidence_score,
                "explanation": c.explanation,
            }
            for c in (session.claims or [])
        ],
        "sources": [
            {
                "title": s.title,
                "url": s.url,
                "credibility_score": s.credibility_score,
            }
            for c in (session.claims or []) for s in []
        ] or [
            {
                "title": s.title or s.url,
                "url": s.url,
                "credibility_score": s.credibility_score,
            }
            for s in (session.sources or [])
        ],
    }

    pdf_bytes = generate_report_pdf(session_data)
    filename = f"veritas_report_{session_id[:8]}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

