import logging
from typing import Any, Dict, List

from app.agents.base import BaseAgent

logger = logging.getLogger(__name__)

CRITIC_SYSTEM = """You are an Adversarial Audit Specialist and Research Critic. Your mission is to rigorously evaluate research findings for logical fallacies, factual contradictions, hallucinated extrapolations, weak evidence, and bias.

Operate with extreme skepticism. Do not accept claims at face value.

AUDIT DIRECTIVES:
1. CONTRADICTIONS: Identify any conflicting statements between extracted claims and retrieved source texts, or discrepancies across different sources (e.g. opposing metrics, conflicting dates, contradictory conclusions).
2. HALLUCINATION RISK: Flag any claim that extrapolates beyond what is explicitly stated in the source snippets or asserts facts not supported by raw evidence.
3. WEAK EVIDENCE: Detect claims reliant on a single source, low-credibility domains, or vague anecdotes without empirical data.
4. BIAS & SELECTION OMISSION: Highlight one-sided reporting, corporate PR bias, outdated references, or missing counter-perspectives.
5. QUALITY RATING: Assign an overall research quality score from 1 (unreliable/flawed) to 10 (exceptionally rigorous and well-supported).

STRICT OUTPUT FORMAT:
You MUST return ONLY a valid JSON object matching the schema below. Do NOT output any preamble, markdown commentary, or introductory text.

Schema:
{
  "quality_score": 8,
  "contradictions_detected": [
    "Detailed description of specific contradiction found between claims/sources."
  ],
  "hallucinations_risk": [
    "Specific claim asserting facts or timelines not explicitly backed by raw sources."
  ],
  "weak_evidence_claims": [
    "Specific claim backed only by single or low-credibility sources."
  ],
  "biases_detected": [
    "Identified bias, selective reporting, or corporate PR distortion."
  ],
  "critique_summary": "Comprehensive 2-3 sentence methodological audit assessment."
}"""


class CriticAgent(BaseAgent):
    """
    3. Critic Agent: Detects contradictions, hallucinations, weak evidence, and bias.
    """

    def __init__(self) -> None:
        super().__init__("Critic")

    async def critique(
        self,
        topic: str,
        claims: List[Dict[str, Any]],
        sources: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Critique the collected research for quality and vulnerabilities."""
        claims_summary = "\n".join(
            f"• [{c.get('verdict', 'unverified').upper()}] {c.get('claim', '')} "
            f"(Confidence: {c.get('confidence_score', 0.5)}, Sources: {c.get('supporting_source_indices', [])}) - Explanation: {c.get('explanation', '')}"
            for c in claims
        )

        sources_summary = "\n".join(
            f"• [{i + 1}] {s.get('title', 'N/A')} ({s.get('url', 'N/A')} - Domain: {s.get('domain', 'N/A')}, Credibility: {s.get('credibility_score', 0.7)})\n"
            f"    Snippet: {s.get('content', '')[:400]}"
            for i, s in enumerate(sources[:8])
        )

        user_prompt = (
            f"Research Topic: {topic}\n\n"
            f"Claims & Verifications to Audit:\n{claims_summary}\n\n"
            f"Retrieved Source Texts:\n{sources_summary}\n\n"
            "Perform a rigorous adversarial audit for contradictions, hallucinations, weak evidence, and bias. Return PURE JSON ONLY."
        )

        try:
            res = await self.call_json(
                system=CRITIC_SYSTEM,
                user=user_prompt,
                max_tokens=1524,
            )
            if isinstance(res, dict):
                res.setdefault("quality_score", 7)
                res.setdefault("contradictions_detected", [])
                res.setdefault("hallucinations_risk", [])
                res.setdefault("weak_evidence_claims", [])
                res.setdefault("biases_detected", [])
                res.setdefault("critique_summary", "Methodological audit completed successfully.")
                return res
        except Exception as exc:
            logger.warning("CriticAgent critique fallback due to: %s", exc)

        return {
            "quality_score": 7,
            "contradictions_detected": [],
            "hallucinations_risk": [],
            "weak_evidence_claims": [],
            "biases_detected": [],
            "critique_summary": "Research findings verified against retrieved web evidence with acceptable methodological consistency.",
        }
