from typing import List, Dict, Any, Optional
import httpx
import logging

from app.config import settings

logger = logging.getLogger(__name__)


class TavilyClient:
    BASE_URL = "https://api.tavily.com"

    def __init__(self) -> None:
        self.api_key = settings.TAVILY_API_KEY
        self.max_results = settings.TAVILY_MAX_RESULTS

    async def search(
        self,
        query: str,
        search_depth: str = "advanced",
        max_results: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """Search the web via Tavily API. Falls back to mock results if key absent."""
        if not self.api_key:
            logger.warning("TAVILY_API_KEY not set — returning mock results")
            return self._mock_results(query)

        payload = {
            "api_key": self.api_key,
            "query": query,
            "search_depth": search_depth,
            "max_results": max_results or self.max_results,
            "include_answer": True,
            "include_raw_content": False,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                resp = await client.post(f"{self.BASE_URL}/search", json=payload)
                resp.raise_for_status()
                data = resp.json()
                return data.get("results", [])
            except Exception as exc:
                logger.error("Tavily search error for '%s': %s", query, exc)
                return self._mock_results(query)

    @staticmethod
    def _mock_results(query: str) -> List[Dict[str, Any]]:
        """Return plausible mock results when the API key is not configured."""
        short_q = query[:50]
        return [
            {
                "url": f"https://example.com/article/{i}",
                "title": f"Research Article {i}: {short_q}",
                "content": (
                    f"[DEMO MODE] This is a mock search result for '{query}'. "
                    "Set TAVILY_API_KEY in your .env for real web search results. "
                    f"Mock article {i} contains extensive research findings."
                ),
                "score": round(0.95 - i * 0.08, 2),
            }
            for i in range(1, settings.TAVILY_MAX_RESULTS + 1)
        ]


tavily = TavilyClient()
