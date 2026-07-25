import json
from typing import List

from app.agents.base import BaseAgent


PLANNER_SYSTEM = """You are a research planning expert. Given a user's research query, decompose it into 3–5 specific, focused sub-questions that together provide a comprehensive answer.

Rules:
- Each sub-question must be self-contained and researchable
- Cover different angles: current state, evidence, challenges, expert consensus, future outlook
- Return ONLY a valid JSON array of strings — no markdown, no explanation

Example output:
["What is the current scientific consensus on X?", "What evidence supports or refutes X?", "What are the main challenges with X?"]"""


class PlannerAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__("Planner")

    async def plan(self, query: str) -> List[str]:
        """Decompose the query into focused sub-questions."""
        response = await self.call(
            system=PLANNER_SYSTEM,
            user=f"Research query: {query}",
            max_tokens=512,
        )

        # Extract JSON array from response
        try:
            start = response.find("[")
            end = response.rfind("]") + 1
            if start >= 0 and end > start:
                sub_questions = json.loads(response[start:end])
                if isinstance(sub_questions, list):
                    return [str(q) for q in sub_questions[:5]]
        except (json.JSONDecodeError, ValueError):
            pass

        # Fallback: parse line-by-line
        lines = [
            line.strip().lstrip("0123456789.-) ").strip()
            for line in response.splitlines()
            if line.strip()
        ]
        questions = [l for l in lines if len(l) > 15][:5]
        return questions or [query]
