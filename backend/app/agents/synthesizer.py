import logging
from typing import Any, Dict, List

from app.agents.base import BaseAgent
from app.config import settings

logger = logging.getLogger(__name__)

SYNTHESIZER_SYSTEM = """You are a Master Research Synthesis Director. Your mission is to author a comprehensive, authoritative, citation-backed final research report.

REPORT ARCHITECTURE RULES:
1. Executive Summary: Begin with a 150–200 word high-level synthesis overview.
2. Structured Markdown: Use clear ## section headers, markdown formatting, tables, and bullet points.
3. Inline Citations: Cite sources inline using exact bracketed numbers like [1], [2], [3] matching the source index provided.
4. Objective Treatment of Disputes: Explicitly discuss disputed facts, contradictions, and methodological gaps identified by the Critic Agent.
5. Key Takeaways: Conclude with a "## Key Takeaways" section (4-5 crisp bullet points).
6. Target Word Count: 500–800 words total.

STRICT OUTPUT FORMAT:
You MUST return ONLY a valid JSON object matching the exact schema below.

Schema:
{
  "executive_summary": "Concise executive summary paragraph.",
  "synthesis_markdown": "Full citation-backed markdown report with ## headers and inline [1], [2] citations.",
  "overall_confidence": 0.88,
  "claims_summary": [
    {
      "claim": "Exact statement of claim",
      "verdict": "verified" | "disputed" | "unverified",
      "confidence_score": 0.90
    }
  ]
}"""


class SynthesizerAgent(BaseAgent):
    """
    4. Synthesizer Agent: Creates final citation-backed report + confidence score per claim.
    """

    def __init__(self) -> None:
        super().__init__("Synthesizer", model=settings.GEMINI_PRO_MODEL)

    async def create_final_report(
        self,
        topic: str,
        claims: List[Dict[str, Any]],
        sources: List[Dict[str, Any]],
        critique: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Synthesize all research components into a final report."""
        claims_text = "\n".join(
            f"• [{c.get('verdict', 'unverified').upper()} - Conf: {c.get('confidence_score', 0.5)}] "
            f"{c.get('claim', '')} (Sources: {c.get('supporting_source_indices', [])}) - Explanation: {c.get('explanation', '')}"
            for c in claims
        )

        sources_text = "\n".join(
            f"[{i + 1}] {s.get('title', 'Unknown')} ({s.get('url', 'N/A')} - Domain: {s.get('domain', 'N/A')}, Credibility: {s.get('credibility_score', 0.7)})\n"
            f"    Snippet: {s.get('content', '')[:300]}"
            for i, s in enumerate(sources[:10])
        )

        critique_text = (
            f"Quality Score: {critique.get('quality_score', 7)}/10\n"
            f"Contradictions: {critique.get('contradictions_detected', [])}\n"
            f"Weak Evidence: {critique.get('weak_evidence_claims', [])}\n"
            f"Summary: {critique.get('critique_summary', '')}"
        )

        user_prompt = (
            f"Research Topic: {topic}\n\n"
            f"Verified Claims & Verdicts:\n{claims_text}\n\n"
            f"Methodological Critique:\n{critique_text}\n\n"
            f"Available Sources for Inline Citation:\n{sources_text}\n\n"
            "Compile the final, authoritative citation-backed report. Return PURE JSON ONLY."
        )

        try:
            res = await self.call_json(
                system=SYNTHESIZER_SYSTEM,
                user=user_prompt,
                max_tokens=3500,
            )

            if isinstance(res, dict) and "synthesis_markdown" in res:
                res.setdefault("executive_summary", f"Executive summary on {topic}.")
                res.setdefault("overall_confidence", self._calc_overall_confidence(claims))
                res.setdefault(
                    "claims_summary",
                    [
                        {
                            "claim": c.get("claim", ""),
                            "verdict": c.get("verdict", "unverified"),
                            "confidence_score": c.get("confidence_score", 0.5),
                        }
                        for c in claims
                    ],
                )
                return res
        except Exception as exc:
            logger.error("SynthesizerAgent report generation failed: %s", exc)

        return self._fallback_report(topic, claims, sources)

    def _calc_overall_confidence(self, claims: List[Dict[str, Any]]) -> float:
        """Calculate weighted average confidence score from claims."""
        if not claims:
            return 0.70
        scores = [float(c.get("confidence_score", 0.5)) for c in claims]
        avg = sum(scores) / len(scores)
        return round(max(0.0, min(1.0, avg)), 2)

    def _fallback_report(
        self,
        topic: str,
        claims: List[Dict[str, Any]],
        sources: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Fallback synthesis report generation."""
        summary = f"This report synthesizes evidence gathered on '{topic}' across {len(sources)} sources."
        markdown_body = f"## Executive Summary\n\n{summary}\n\n## Key Claims & Evidence\n\n"
        for i, c in enumerate(claims, 1):
            markdown_body += f"{i}. **{c.get('claim')}** — *Verdict: {c.get('verdict')}*\n"

        markdown_body += "\n## Key Takeaways\n\n- Research completed successfully.\n- Multiple web sources were evaluated.\n"

        return {
            "executive_summary": summary,
            "synthesis_markdown": markdown_body,
            "overall_confidence": self._calc_overall_confidence(claims),
            "claims_summary": [
                {
                    "claim": c.get("claim", ""),
                    "verdict": c.get("verdict", "unverified"),
                    "confidence_score": c.get("confidence_score", 0.5),
                }
                for c in claims
            ],
        }
