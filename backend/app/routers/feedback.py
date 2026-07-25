from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Feedback, FinalReport, ResearchSession
from app.schemas import FeedbackCreate, FeedbackRead

router = APIRouter(tags=["feedback"])


@router.post("/feedback", response_model=FeedbackRead, status_code=201)
async def submit_feedback(
    body: FeedbackCreate,
    db: AsyncSession = Depends(get_db),
):
    """Submit a rating or comment on a research report."""
    # Validate session exists if provided
    if body.session_id:
        row = await db.execute(
            select(ResearchSession).where(ResearchSession.id == body.session_id)
        )
        if not row.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Session not found")

    # Validate report exists if provided
    if body.report_id:
        row = await db.execute(
            select(FinalReport).where(FinalReport.id == body.report_id)
        )
        if not row.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Report not found")

    fb = Feedback(**body.model_dump())
    db.add(fb)
    await db.commit()
    await db.refresh(fb)
    return fb
