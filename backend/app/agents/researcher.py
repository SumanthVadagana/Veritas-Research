import asyncio
import logging
from typing import Any, Dict, List

from app.agents.base import BaseAgent
from app.utils.credibility import score_source_credibility
from app.utils.tavily_client import tavily

logger = logging.getLogger(__name__)

PLANNING_SYSTEM = """You are a Lead Research Strategy Officer. Your task is to decompose a complex research topic into targeted, highly specific search engine sub-queries.

SEARCH STRATEGY REQUIREMENTS:
- Generate the EXACT number of requested sub-queries.
- Every sub-query must be objective, factual, concise, and optimized for search engine retrieval.
- Cover distinct dimensions: foundational consensus, empirical metrics/data, technical challenges/debates, and current state.
- Avoid vague keywords; include key terms, dates, and technical nomenclature.

STRICT OUTPUT FORMAT:
You MUST return ONLY a valid JSON object. No preamble, no conversational text.

Schema:
{
  "sub_queries": [
    "specific factual search sub-query 1",
    "specific factual search sub-query 2"
  ]
}"""

EXTRACTION_SYSTEM = """You are a Scientific Fact Extraction Specialist. Your job is to extract explicit, verifiable factual claims from web search results.

EXTRACTION RULES:
- Extract 4–8 distinct, verifiable factual statements directly supported by the search texts.
- ZERO HALLUCINATION: Do NOT infer or extrapolate facts not explicitly stated in the source snippets.
- Each claim must be a standalone, self-contained statement.
- For each claim, cite the 1-based source indices that contain the supporting evidence.

STRICT OUTPUT FORMAT:
You MUST return ONLY a valid JSON object matching the exact schema below.

Schema:
{
  "claims": [
    {
      "claim": "Standalone verifiable factual claim.",
      "supporting_source_indices": [1, 2],
      "context": "Direct context or excerpt snippet backing the claim."
    }
  ]
}"""


class ResearcherAgent(BaseAgent):
    """
    1. Researcher Agent: Breaks topic into sub-queries, executes parallel searches, scores credibility, and extracts claims.
    """

    def __init__(self) -> None:
        super().__init__("Researcher")

    async def break_topic(self, topic: str, depth: str = "standard") -> List[str]:
        """Break down a topic into focused search sub-queries with ultra-fast execution."""
        depth_map = {"quick": 1, "standard": 2, "deep": 3}
        num_queries = depth_map.get(str(depth).lower(), 2)

        user_prompt = (
            f"Research Topic: {topic}\n"
            f"Decompose this topic into exactly {num_queries} targeted search sub-queries. Return PURE JSON ONLY."
        )


        try:
            res = await self.call_json(
                system=PLANNING_SYSTEM,
                user=user_prompt,
                max_tokens=256,
            )
            if isinstance(res, dict) and "sub_queries" in res:
                queries = [str(q) for q in res["sub_queries"] if q]
                if queries:
                    return queries[:num_queries]
        except Exception as exc:
            logger.warning("Researcher break_topic fallback due to: %s", exc)

        return [
            f"{topic} key facts and consensus",
            f"{topic} latest evidence and analysis",
        ][:num_queries]


    async def run_parallel_searches(self, sub_queries: List[str]) -> List[Dict[str, Any]]:
        """Run parallel searches across sub-queries using Tavily."""
        tasks = [tavily.search(q, max_results=5) for q in sub_queries]
        results_list = await asyncio.gather(*tasks, return_exceptions=True)

        all_sources: List[Dict[str, Any]] = []
        seen_urls = set()

        for idx, res in enumerate(results_list):
            if isinstance(res, Exception):
                logger.error("Search failed for sub-query '%s': %s", sub_queries[idx], res)
                continue

            for s in res:
                url = s.get("url", "")
                if url and url not in seen_urls:
                    seen_urls.add(url)
                    # Score credibility
                    s["credibility_score"] = score_source_credibility(s)
                    all_sources.append(s)

        # Sort sources by credibility score descending
        all_sources.sort(key=lambda x: x.get("credibility_score", 0.0), reverse=True)
        return all_sources

    async def extract_claims(self, topic: str, sub_queries: List[str], sources: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract verifiable claims from gathered sources."""
        if not sources:
            return []

        # Prepare context snippets with 1-based source indices
        context_parts = []
        for i, s in enumerate(sources[:8], 1):
            context_parts.append(
                f"Source [{i}] ({s.get('url', 'N/A')} - Credibility: {s.get('credibility_score', 0.7)}):\n"
                f"Title: {s.get('title', '')}\n"
                f"Snippet: {s.get('content', '')[:500]}"
            )
        sources_text = "\n\n---\n\n".join(context_parts)

        user_prompt = (
            f"Topic: {topic}\n\n"
            f"Search Sub-queries executed: {', '.join(sub_queries)}\n\n"
            f"Gathered Search Sources:\n{sources_text}\n\n"
            "Extract 4–8 verifiable claims based strictly on these sources. Return PURE JSON ONLY."
        )

        try:
            res = await self.call_json(
                system=EXTRACTION_SYSTEM,
                user=user_prompt,
                max_tokens=1000,
            )
            if isinstance(res, dict) and "claims" in res:
                claims = res["claims"]
                if isinstance(claims, list) and len(claims) > 0:
                    return claims
        except Exception as exc:
            logger.warning("Claim extraction fallback due to: %s", exc)

        top_source = sources[0] if sources else {}
        snippet_text = top_source.get("content", "")[:200] if top_source else ""

        return [
            {
                "claim": f"{topic}",
                "supporting_source_indices": [1],
                "context": snippet_text or f"Evidence gathered from research on '{topic}'.",
            }
        ]


    async def execute(self, topic: str, depth: str = "standard") -> Dict[str, Any]:
        """Full execution pipeline for Researcher Agent."""
        sub_queries = await self.break_topic(topic, depth)
        sources = await self.run_parallel_searches(sub_queries)
        claims = await self.extract_claims(topic, sub_queries, sources)

        return {
            "sub_queries": sub_queries,
            "sources": sources,
            "claims": claims,
        }
