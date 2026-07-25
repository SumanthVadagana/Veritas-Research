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
