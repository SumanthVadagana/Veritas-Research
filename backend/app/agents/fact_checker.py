import json
from typing import Any, Dict, List

from app.agents.base import BaseAgent


FACT_CHECKER_SYSTEM = """You are a professional fact-checker. Extract key claims from the research and verify them against the sources provided.

Return ONLY a JSON array (5–7 items) where each item has exactly:
- "claim": string — the specific verifiable claim
- "verdict": string — one of "verified", "disputed", "unverified"
- "confidence": string — one of "high", "medium", "low"
- "explanation": string — 1–2 sentence explanation of the verdict
- "supporting_sources": integer — number of sources supporting this claim

Focus on the most important factual claims. Return ONLY the JSON array."""


class FactCheckerAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__("FactChecker")

    async def check_facts(
        self,
        query: str,
        findings: List[Dict[str, Any]],
        critique: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        """Cross-reference claims across all sources and assign verdicts."""
        # Gather source snippets
        source_snippets: List[str] = []
        for f in findings:
            for s in f.get("sources", []):
                snippet = f"{s.get('title', 'Unknown')}: {s.get('content', '')[:250]}"
                source_snippets.append(snippet)

        sources_text = "\n---\n".join(source_snippets[:12])
        findings_text = "\n\n".join(
            f"Sub-question: {f['sub_question']}\nFindings: {f['summary']}"
            for f in findings
        )

        response = await self.call(
            system=FACT_CHECKER_SYSTEM,
            user=(
                f"Query: {query}\n\n"
                f"Research Findings:\n{findings_text}\n\n"
                f"Source Snippets:\n{sources_text}"
            ),
            max_tokens=1500,
        )

        try:
            start = response.find("[")
            end = response.rfind("]") + 1
            if start >= 0 and end > start:
                results = json.loads(response[start:end])
                if isinstance(results, list):
                    return results[:7]
        except (json.JSONDecodeError, ValueError):
            pass

        return []
