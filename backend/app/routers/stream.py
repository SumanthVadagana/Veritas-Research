from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.database import AsyncSessionLocal
from app.orchestrator import run_research_pipeline

router = APIRouter(tags=["stream"])


@router.get("/stream/{session_id}")
async def stream_research(session_id: str):
    """
    SSE endpoint — connecting triggers the full multi-agent pipeline.
    Stream events are JSON objects with a 'type' discriminator field.
    """

    async def event_generator():
        async with AsyncSessionLocal() as db:
            async for event in run_research_pipeline(session_id, db):
                yield event

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
        },
    )
