import uuid
from typing import Union

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal, get_db
from app.models import ResearchSession
from app.orchestrator import run_research_pipeline
from app.schemas import ResearchRequest, ResearchResponse

router = APIRouter(tags=["research"])


@router.post("/research")
async def execute_research(
    request: Request,
    body: ResearchRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Main Research & Fact-Verification Endpoint.
    Body: { "topic": "...", "depth": "quick|standard|deep" }
    Returns Server-Sent Events (SSE) stream by default.
    """
    try:
        topic_text = body.get_topic()
    except ValueError as err:
        raise HTTPException(status_code=422, detail=str(err))

    depth_int = body.get_depth_int()

    # Create session entry
    session_id = str(uuid.uuid4())
    session = ResearchSession(
        id=session_id,
        user_id=body.user_id,
        query=topic_text,
        depth=depth_int,
        status="pending",
    )
    db.add(session)
    await db.commit()

    # Check if client explicitly asks for JSON response only
    accept_hdr = request.headers.get("accept", "")
    if "application/json" in accept_hdr and "text/event-stream" not in accept_hdr:
        return JSONResponse(
            content={
                "session_id": session_id,
                "status": "pending",
                "message": f"Research session '{session_id}' created. Connect to /api/stream/{session_id} to stream SSE events.",
            }
        )

    # Return SSE StreamingResponse directly
    async def sse_event_generator():
        async with AsyncSessionLocal() as session_db:
            async for sse_event in run_research_pipeline(session_id, session_db):
                yield sse_event

    return StreamingResponse(
        sse_event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
        },
    )
