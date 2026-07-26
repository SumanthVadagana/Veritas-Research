import logging
from typing import Any, Dict, List

from app.agents.base import BaseAgent
from app.config import settings

logger = logging.getLogger(__name__)

SYNTHESIZER_SYSTEM = """You are a Master Research Synthesis Director and Fact-Verification Expert. Your mission is to deliver a comprehensive, authoritative, citation-backed final research report.

CRITICAL OUTPUT REQUIREMENTS:
You MUST return ONLY a valid JSON object matching the EXACT schema below. No extra text, no markdown fences around the JSON.

Schema:
{
  "verified_answer": "A direct, clear 1-3 sentence answer to the user's question. State what is TRUE/FALSE/UNVERIFIED. Be specific and definitive where evidence supports it.",
  "explanation": "A 2-4 paragraph explanation providing full context: what the evidence shows, why the answer is supported, what nuances or caveats exist, and what remains uncertain.",
  "executive_summary": "Concise 150-200 word executive summary paragraph.",
  "synthesis_markdown": "Full citation-backed markdown report with ## headers and inline [1], [2] citations. Include: ## Overview, ## Key Evidence, ## Disputed Claims, ## Conclusion, ## Key Takeaways.",
  "overall_confidence": 0.88,
  "sources_used": [
    {"index": 1, "url": "https://...", "title": "Source Title", "credibility": 0.9}
  ],
  "claims_summary": [
    {
      "claim": "Exact statement of claim",
      "verdict": "verified",
      "confidence_score": 0.90,
      "explanation": "Brief one-sentence reason for this verdict."
    }
  ]
}

VERDICT VALUES: "verified" | "disputed" | "unverified"
CONFIDENCE: float between 0.0 and 1.0

REPORT RULES:
1. verified_answer must be honest — if claims are disputed, say so clearly.
2. Inline citations like [1], [2] must match the sources_used index numbers.
3. Discuss contradictions and methodological gaps.
4. Key Takeaways: 4-5 crisp bullet points.
5. Target synthesis_markdown: 500-800 words."""


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
            f"Research Topic / Query: {topic}\n\n"
            f"Verified Claims & Verdicts:\n{claims_text}\n\n"
            f"Methodological Critique:\n{critique_text}\n\n"
            f"Available Sources for Inline Citation:\n{sources_text}\n\n"
            "Compile the final, authoritative citation-backed report. "
            "The verified_answer must directly answer the user's query. "
            "Return PURE JSON ONLY."
        )

        try:
            res = await self.call_json(
                system=SYNTHESIZER_SYSTEM,
                user=user_prompt,
                max_tokens=4000,
            )

            if isinstance(res, dict) and "synthesis_markdown" in res:
                res.setdefault("verified_answer", self._derive_answer(topic, claims))
                res.setdefault("explanation", res.get("executive_summary", f"Research on '{topic}' completed."))
                res.setdefault("executive_summary", f"Executive summary on {topic}.")
                res.setdefault("overall_confidence", self._calc_overall_confidence(claims))
                res.setdefault(
                    "sources_used",
                    [
                        {
                            "index": i + 1,
                            "url": s.get("url", ""),
                            "title": s.get("title", "Source"),
                            "credibility": s.get("credibility_score", 0.7),
                        }
                        for i, s in enumerate(sources[:10])
                    ],
                )
                res.setdefault(
                    "claims_summary",
                    [
                        {
                            "claim": c.get("claim", ""),
                            "verdict": c.get("verdict", "unverified"),
                            "confidence_score": c.get("confidence_score", 0.5),
                            "explanation": c.get("explanation", ""),
                        }
                        for c in claims
                    ],
                )
                return res
        except Exception as exc:
            logger.error("SynthesizerAgent report generation failed: %s", exc)

        return self._fallback_report(topic, claims, sources)

    def _derive_answer(self, topic: str, claims: List[Dict[str, Any]]) -> str:
        """Derive a short verified answer from claims."""
        if not claims:
            return f"Insufficient evidence was found to definitively answer the query: '{topic}'."
        verified = [c for c in claims if c.get("verdict") == "verified"]
        disputed = [c for c in claims if c.get("verdict") == "disputed"]
        if verified:
            top = verified[0]
            return f"{top.get('claim', '')} (Confidence: {int(float(top.get('confidence_score', 0.7)) * 100)}%)"
        elif disputed:
            return f"The information about '{topic}' is disputed. {disputed[0].get('explanation', '')}"
        return f"The query '{topic}' could not be conclusively verified from available sources."

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
        answer = self._derive_answer(topic, claims)
        markdown_body = f"## Overview\n\n{summary}\n\n## Key Claims & Evidence\n\n"
        for i, c in enumerate(claims, 1):
            markdown_body += f"{i}. **{c.get('claim')}** — *Verdict: {c.get('verdict')}*\n   {c.get('explanation', '')}\n\n"

        markdown_body += "\n## Key Takeaways\n\n- Research completed successfully.\n- Multiple web sources were evaluated.\n"

        return {
            "verified_answer": answer,
            "explanation": summary,
            "executive_summary": summary,
            "synthesis_markdown": markdown_body,
            "overall_confidence": self._calc_overall_confidence(claims),
            "sources_used": [
                {
                    "index": i + 1,
                    "url": s.get("url", ""),
                    "title": s.get("title", "Source"),
                    "credibility": s.get("credibility_score", 0.7),
                }
                for i, s in enumerate(sources[:10])
            ],
            "claims_summary": [
                {
                    "claim": c.get("claim", ""),
                    "verdict": c.get("verdict", "unverified"),
                    "confidence_score": c.get("confidence_score", 0.5),
                    "explanation": c.get("explanation", ""),
                }
                for c in claims
            ],
        }
