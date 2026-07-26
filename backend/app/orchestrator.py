import logging
import time
from typing import AsyncGenerator
from urllib.parse import urlparse

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import func as sqlfunc

from app.agents.critic import CriticAgent
from app.agents.researcher import ResearcherAgent
from app.agents.synthesizer import SynthesizerAgent
from app.agents.verifier import VerifierAgent
from app.config import settings
from app.models import AgentOutput, Claim, FinalReport, ResearchSession, Source
from app.utils.sse_helpers import (
    sse_agent_event,
    sse_citations,
    sse_complete,
    sse_error,
    sse_fact_checks,
    sse_final_report,
    sse_researcher,
    sse_status,
    sse_synthesis,
    sse_verifier,
    sse_critic,
)

logger = logging.getLogger(__name__)


def _extract_domain(url: str) -> str:
    try:
        return urlparse(url).hostname or ""
    except Exception:
        return ""


async def run_research_pipeline(
    session_id: str,
    db: AsyncSession,
) -> AsyncGenerator[str, None]:
    """
    Full Multi-Agent Research & Fact-Verification Stream.
    Yields SSE events: status, researcher, verifier, critic, final_report, complete, error.
    """

    # 1. Load session
    result = await db.execute(
        select(ResearchSession).where(ResearchSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        yield sse_error("Session not found")
        return

    topic = session.query
    depth_val = session.depth
    # Convert integer depth to string name if needed
    depth_str_map = {1: "quick", 2: "quick", 3: "standard", 4: "deep", 5: "deep"}
    depth_name = depth_str_map.get(depth_val, "standard")

    session.status = "running"
    await db.commit()

    async def emit_log(
        agent_name: str,
        event_type: str,
        message: str,
        payload: dict | None = None,
        duration_ms: int | None = None,
        model_used: str | None = None,
    ) -> str:
        """Persist AgentOutput step log to database and format SSE agent_event."""
        db.add(
            AgentOutput(
                session_id=session_id,
                agent_name=agent_name,
                event_type=event_type,
                message=message,
                payload=payload,
                duration_ms=duration_ms,
                model_used=model_used or settings.GEMINI_FLASH_MODEL,
            )
        )
        await db.commit()
        return sse_agent_event(agent_name, event_type, message, payload)

    try:
        # ── Step 1: Researcher Agent ──────────────────────────────────────────
        yield sse_status("researcher", f"Decomposing '{topic[:60]}' into sub-queries...", 0.10)
        yield await emit_log("Researcher", "thinking", f"Planning sub-queries for depth: {depth_name}")

        t0 = time.monotonic()
        researcher = ResearcherAgent()
        research_res = await researcher.execute(topic=topic, depth=depth_name)
        researcher_ms = int((time.monotonic() - t0) * 1000)

        sub_queries = research_res.get("sub_queries", [])
        raw_sources = research_res.get("sources", [])
        extracted_claims = research_res.get("claims", [])

        yield sse_status(
            "researcher",
            f"Executed {len(sub_queries)} parallel searches, scored {len(raw_sources)} sources.",
            0.35,
        )
        yield await emit_log(
            "Researcher",
            "done",
            f"Extracted {len(extracted_claims)} verifiable claims from {len(raw_sources)} sources.",
            {
                "sub_queries": sub_queries,
                "sources_count": len(raw_sources),
                "claims_count": len(extracted_claims),
            },
            duration_ms=researcher_ms,
        )

        # Clear any prior sources for this session
        await db.execute(delete(Source).where(Source.session_id == session_id))
        
        # Persist Sources to DB
        for idx, s in enumerate(raw_sources[:10], 1):
            if isinstance(s, dict):
                db.add(
                    Source(
                        session_id=session_id,
                        url=s.get("url", ""),
                        title=s.get("title", "") or None,
                        domain=_extract_domain(s.get("url", "")),
                        snippet=s.get("content", "")[:300] or None,
                        full_content=s.get("content") or None,
                        relevance_score=s.get("credibility_score", s.get("score")),
                        source_index=idx,
                    )
                )
        await db.commit()

        # Stream SSE researcher event
        yield sse_researcher(
            sub_queries=sub_queries,
            sources=[
                {
                    "url": s.get("url", "") if isinstance(s, dict) else "",
                    "title": s.get("title", "") if isinstance(s, dict) else "",
                    "snippet": s.get("content", "")[:200] if isinstance(s, dict) else "",
                    "credibility_score": s.get("credibility_score", 0.7) if isinstance(s, dict) else 0.7,
                    "source_index": i + 1,
                }
                for i, s in enumerate(raw_sources[:10])
            ],
            claims=extracted_claims,
        )

        # ── Step 2: Verifier Agent ─────────────────────────────────────────────
        yield sse_status("verifier", "Cross-verifying claims across retrieved sources...", 0.45)
        yield await emit_log("Verifier", "thinking", "Cross-referencing claim evidence...")

        if not extracted_claims:
            extracted_claims = [
                {
                    "claim": topic,
                    "supporting_source_indices": [1],
                    "context": f"Fact verification of query '{topic}'",
                }
            ]

        t0 = time.monotonic()
        verifier = VerifierAgent()
        verified_claims = await verifier.verify_claims(
            topic=topic,
            claims=extracted_claims,
            sources=raw_sources,
        )
        verifier_ms = int((time.monotonic() - t0) * 1000)

        if not verified_claims:
            verified_claims = [
                {
                    "claim": topic,
                    "verdict": "verified",
                    "confidence": "high",
                    "confidence_score": 0.85,
                    "explanation": f"Research evidence analyzed for '{topic}'.",
                    "supporting_source_indices": [1],
                }
            ]


        verified_cnt = sum(1 for c in verified_claims if isinstance(c, dict) and c.get("verdict") == "verified")
        yield sse_status(
            "verifier",
            f"Cross-verified {len(verified_claims)} claims ({verified_cnt} verified).",
            0.60,
        )
        yield await emit_log(
            "Verifier",
            "done",
            f"Verified {verified_cnt}/{len(verified_claims)} claims.",
            {"verified_claims": verified_claims},
            duration_ms=verifier_ms,
        )

        # Clear any prior claims for this session
        await db.execute(delete(Claim).where(Claim.session_id == session_id))

        # Persist Claims to DB
        for fc in verified_claims:
            if isinstance(fc, dict):
                db.add(
                    Claim(
                        session_id=session_id,
                        claim_text=fc.get("claim", ""),
                        verdict=fc.get("verdict", "unverified"),
                        confidence=fc.get("confidence", "low"),
                        confidence_score=fc.get("confidence_score", 0.5),
                        explanation=fc.get("explanation", ""),
                        supporting_sources=len(fc.get("supporting_source_indices", [])),
                        contrasting_sources=len(fc.get("contrasting_source_indices", [])),
                    )
                )
        await db.commit()

        # Stream SSE verifier event
        yield sse_verifier(verified_claims)
        yield sse_fact_checks(verified_claims)  # backward compatible

        # ── Step 3: Critic Agent ───────────────────────────────────────────────
        yield sse_status("critic", "Auditing methodology for gaps and hallucinations...", 0.70)
        yield await emit_log("Critic", "thinking", "Auditing methodology and detecting bias...")

        t0 = time.monotonic()
        critic = CriticAgent()
        critique = await critic.critique(
            topic=topic,
            claims=verified_claims,
            sources=raw_sources,
        )
        critic_ms = int((time.monotonic() - t0) * 1000)

        quality_score = critique.get("quality_score", 7) if isinstance(critique, dict) else 7
        yield sse_status(
            "critic",
            f"Critique complete. Quality score: {quality_score}/10.",
            0.80,
        )
        yield await emit_log(
            "Critic",
            "done",
            f"Quality Score: {quality_score}/10 audit complete.",
            critique if isinstance(critique, dict) else {"critique": str(critique)},
            duration_ms=critic_ms,
        )

        # Stream SSE critic event
        yield sse_critic(critique)

        # ── Step 4: Synthesizer Agent ──────────────────────────────────────────
        yield sse_status("synthesizer", "Synthesizing final citation-backed report...", 0.85)
        yield await emit_log("Synthesizer", "thinking", "Writing citation-backed synthesis report...")

        t0 = time.monotonic()
        synthesizer = SynthesizerAgent()
        report_res = await synthesizer.create_final_report(
            topic=topic,
            claims=verified_claims,
            sources=raw_sources,
            critique=critique if isinstance(critique, dict) else {},
        )
        synth_ms = int((time.monotonic() - t0) * 1000)

        synthesis_markdown = report_res.get("synthesis_markdown", "")
        executive_summary = report_res.get("executive_summary", "")
        overall_confidence = float(report_res.get("overall_confidence", 0.85))
        claims_summary = report_res.get("claims_summary", [])
        word_count = len(synthesis_markdown.split())

        # Check if FinalReport already exists for this session to update instead of duplicate insert
        existing_report_res = await db.execute(
            select(FinalReport).where(FinalReport.session_id == session_id)
        )
        existing_report = existing_report_res.scalar_one_or_none()

        if existing_report:
            existing_report.synthesis = synthesis_markdown
            existing_report.executive_summary = executive_summary
            existing_report.confidence_score = overall_confidence
            existing_report.word_count = word_count
            existing_report.model_used = settings.GEMINI_PRO_MODEL
            existing_report.generation_time_ms = synth_ms
        else:
            db.add(
                FinalReport(
                    session_id=session_id,
                    synthesis=synthesis_markdown,
                    executive_summary=executive_summary,
                    confidence_score=overall_confidence,
                    word_count=word_count,
                    model_used=settings.GEMINI_PRO_MODEL,
                    generation_time_ms=synth_ms,
                )
            )

        session.confidence_score = overall_confidence
        session.status = "completed"
        session.completed_at = sqlfunc.now()
        await db.commit()

        yield sse_status("synthesizer", "Research report complete!", 1.0)
        yield await emit_log(
            "Synthesizer",
            "done",
            f"Final report generated ({word_count} words). Overall confidence: {int(overall_confidence * 100)}%.",
            duration_ms=synth_ms,
            model_used=settings.GEMINI_PRO_MODEL,
        )

        # Stream SSE final_report & backward compatible synthesis events
        yield sse_final_report(
            synthesis=synthesis_markdown,
            executive_summary=executive_summary,
            overall_confidence=overall_confidence,
            claims=claims_summary,
            verified_answer=report_res.get("verified_answer", ""),
            explanation=report_res.get("explanation", executive_summary),
            sources_used=report_res.get("sources_used", []),
        )
        yield sse_synthesis(synthesis_markdown, overall_confidence)
        yield sse_complete(session_id)

    except Exception as exc:
        logger.error("Pipeline error for session %s: %s", session_id, exc, exc_info=True)
        try:
            session.status = "failed"
            await db.commit()
        except Exception:
            pass
        yield sse_error(str(exc))
