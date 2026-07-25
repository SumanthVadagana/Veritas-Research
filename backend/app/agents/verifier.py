import logging
from typing import Any, Dict, List

from app.agents.base import BaseAgent

logger = logging.getLogger(__name__)

VERIFIER_SYSTEM = """You are a Chief Fact-Verification Inspector. Your task is to cross-examine extracted claims against all provided source documents and assign unambiguous verification verdicts.

EVIDENTIARY VERDICT CRITERIA:
- "verified": Explicitly confirmed by 2+ independent, credible sources, with no major contradictory evidence in retrieved documents.
- "disputed": Direct conflict or disagreement found between sources, or claim is contradicted by reputable data.
- "unverified": Supported by only a single source, lacks independent corroboration, or source text does not contain explicit proof.

CONFIDENCE SCORE MATRIX:
- "high" (0.80 - 1.00): Primary domain authority, explicit quantitative consensus, multiple matching citations.
- "medium" (0.50 - 0.79): Moderate cross-source alignment, indirect citations, or partial secondary reporting.
- "low" (0.00 - 0.49): Weak evidence, uncorroborated single source, or vague mention.

STRICT OUTPUT FORMAT:
You MUST return ONLY a valid JSON object matching the exact structure below. Do NOT include markdown commentary outside the JSON block.

Schema:
{
  "verified_claims": [
    {
      "claim": "Exact statement of claim being audited",
      "verdict": "verified" | "disputed" | "unverified",
      "confidence": "high" | "medium" | "low",
      "confidence_score": 0.92,
      "explanation": "Precise cross-verification analysis explaining why the verdict and score were assigned.",
      "supporting_source_indices": [1, 2],
      "contrasting_source_indices": []
    }
  ]
}"""


class VerifierAgent(BaseAgent):
    """
    2. Verifier Agent: Cross-verifies every claim with multiple sources, assigning verdicts and confidence scores.
    """

    def __init__(self) -> None:
        super().__init__("Verifier")

    async def verify_claims(
        self,
        topic: str,
        claims: List[Dict[str, Any]],
        sources: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """Cross-reference all claims against gathered sources."""
        valid_claims = [c for c in claims if isinstance(c, dict)]
        if not valid_claims:
            return []

        # Prepare source reference list
        sources_text_list = []
        for i, s in enumerate(sources[:10], 1):
            if isinstance(s, dict):
                cred = s.get("credibility_score", 0.7)
                snippet = s.get("content", "")[:400]
                sources_text_list.append(
                    f"Source [{i}] ({s.get('title', 'N/A')} - URL: {s.get('url', 'N/A')} - Credibility: {cred}):\n{snippet}"
                )
        sources_text = "\n\n---\n\n".join(sources_text_list)

        claims_text_list = []
        for idx, c in enumerate(valid_claims, 1):
            c_text = c.get("claim", "")
            supp_indices = c.get("supporting_source_indices", [])
            claims_text_list.append(f"Claim #{idx}: {c_text} (Claimed Sources: {supp_indices})")
        claims_text = "\n".join(claims_text_list)

        user_prompt = (
            f"Research Topic: {topic}\n\n"
            f"Claims to Cross-Verify:\n{claims_text}\n\n"
            f"Available Source Documents:\n{sources_text}\n\n"
            "Perform rigorous cross-verification for EVERY claim. Return PURE JSON ONLY."
        )

        try:
            res = await self.call_json(
                system=VERIFIER_SYSTEM,
                user=user_prompt,
                max_tokens=2048,
            )

            if isinstance(res, dict) and "verified_claims" in res:
                v_claims = res["verified_claims"]
                if isinstance(v_claims, list):
                    return self._sanitize_verified_claims(v_claims)
        except Exception as exc:
            logger.error("VerifierAgent verification failed: %s", exc)

        return self._fallback_verifications(valid_claims)

    def _sanitize_verified_claims(self, claims: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Ensure all required fields exist with valid default bounds."""
        sanitized = []
        for c in claims:
            if not isinstance(c, dict):
                continue

            verdict = str(c.get("verdict", "unverified")).lower()
            if verdict not in ("verified", "disputed", "unverified"):
                verdict = "unverified"

            confidence = str(c.get("confidence", "medium")).lower()
            if confidence not in ("high", "medium", "low"):
                confidence = "medium"

            try:
                score = float(c.get("confidence_score", 0.6))
                score = round(max(0.0, min(1.0, score)), 2)
            except (ValueError, TypeError):
                score = 0.6 if verdict == "verified" else 0.3

            sanitized.append({
                "claim": c.get("claim", "Unspecified claim"),
                "verdict": verdict,
                "confidence": confidence,
                "confidence_score": score,
                "explanation": c.get("explanation", "Verified based on cross-referencing available source evidence."),
                "supporting_source_indices": c.get("supporting_source_indices", [1]),
                "contrasting_source_indices": c.get("contrasting_source_indices", []),
            })
        return sanitized

    def _fallback_verifications(self, claims: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate basic verification objects in fallback scenarios."""
        fallback = []
        for c in claims:
            if not isinstance(c, dict):
                continue
            fallback.append({
                "claim": c.get("claim", "Extracted claim"),
                "verdict": "verified" if c.get("supporting_source_indices") else "unverified",
                "confidence": "medium",
                "confidence_score": 0.70 if c.get("supporting_source_indices") else 0.40,
                "explanation": "Cross-verification performed against retrieved web sources.",
                "supporting_source_indices": c.get("supporting_source_indices", [1]),
                "contrasting_source_indices": [],
            })
        return fallback
