import asyncio
import json
import logging
import warnings
from typing import Any, Dict, Optional, Union

warnings.filterwarnings("ignore", category=FutureWarning)
import google.generativeai as genai

from app.config import settings

logger = logging.getLogger(__name__)


class BaseAgent:
    """
    Base class for all multi-agent system components using Google Gemini API.
    Provides API wrapper, strict JSON parsing, automatic rate-limit backoff, and fallback logic.
    """

    def __init__(self, name: str, model: Optional[str] = None) -> None:
        self.name = name
        self.model = model or settings.GEMINI_FLASH_MODEL

    def _get_api_keys(self) -> list:
        """Return list of non-empty configured Gemini API keys."""
        keys = []
        if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "demo":
            keys.append(settings.GEMINI_API_KEY)
        if settings.GEMINI_API_KEY_2 and settings.GEMINI_API_KEY_2 != "demo":
            keys.append(settings.GEMINI_API_KEY_2)
        return keys

    async def call(
        self,
        system: str,
        user: str,
        max_tokens: int = 2048,
    ) -> str:
        """Call Google Gemini API with multi-key failover and retries."""
        keys = self._get_api_keys()
        if not keys:
            logger.warning(
                "%s: GEMINI_API_KEY missing — utilizing demo response mode", self.name
            )
            return self._mock_response(user)

        last_error = None

        # Try key 1 then key 2 if key 1 encounters quota/rate limit/error
        for key_index, key in enumerate(keys):
            genai.configure(api_key=key)

            for attempt in range(2):
                try:
                    generative_model = genai.GenerativeModel(
                        model_name=self.model,
                        system_instruction=system,
                    )

                    generation_config = genai.types.GenerationConfig(
                        max_output_tokens=max_tokens,
                        temperature=0.2,
                    )

                    response = await generative_model.generate_content_async(
                        user,
                        generation_config=generation_config,
                    )
                    return response.text
                except Exception as exc:
                    last_error = exc
                    err_str = str(exc).lower()
                    logger.warning(
                        "%s Gemini Key #%d attempt %d failed: %s",
                        self.name,
                        key_index + 1,
                        attempt + 1,
                        exc,
                    )

                    # If rate-limited or quota error and there is a secondary key, break to try secondary key immediately!
                    if ("429" in err_str or "quota" in err_str or "resourceexhausted" in err_str) and key_index < len(keys) - 1:
                        logger.info("%s switching to secondary Gemini API key immediately...", self.name)
                        break

                    if "429" in err_str or "quota" in err_str or "resourceexhausted" in err_str:
                        await asyncio.sleep(1.5 * (attempt + 1))
                        continue
                    elif "404" in err_str and self.model != "gemini-2.0-flash":
                        self.model = "gemini-2.0-flash"
                        continue
                    else:
                        break

        logger.error(
            "%s Google Gemini API keys exhausted after retries (%s). Using safe fallback.",
            self.name,
            last_error,
        )
        return self._mock_response(user)


    async def call_json(
        self,
        system: str,
        user: str,
        max_tokens: int = 2048,
        retries: int = 2,
    ) -> Union[Dict[str, Any], list]:
        """
        Call LLM with strict instruction to produce JSON.
        Parses JSON automatically, strips markdown fences if present, and retries on parse failure.
        """
        json_system = (
            f"{system}\n\n"
            "IMPORTANT: Your response MUST be valid JSON only. Do not include any introductory or concluding text. "
            "If using markdown blocks, wrap your output in ```json ... ```."
        )

        current_user_prompt = user
        for attempt in range(retries + 1):
            raw_text = await self.call(
                system=json_system,
                user=current_user_prompt,
                max_tokens=max_tokens,
            )

            parsed = self.extract_json(raw_text)
            if parsed is not None:
                return parsed

            logger.warning(
                "%s: Failed to parse JSON on attempt %d/%d. Raw response snippet: %s",
                self.name,
                attempt + 1,
                retries + 1,
                raw_text[:150],
            )

            if attempt < retries:
                current_user_prompt = (
                    f"{user}\n\n"
                    f"CRITICAL ERROR: Your previous response was invalid JSON. "
                    f"Please output ONLY valid JSON without any markdown explanations."
                )

        # Safe fallback if JSON parsing fails after retries
        return {"status": "fallback", "message": f"{self.name} generated unstructured text output."}

    @staticmethod
    def extract_json(text: str) -> Optional[Union[Dict[str, Any], list]]:
        """Extract and parse JSON from raw text or markdown code fences."""
        if not text:
            return None

        text = text.strip()

        # 1. Direct parse attempt
        try:
            return json.loads(text)
        except (json.JSONDecodeError, TypeError):
            pass

        # 2. Extract from ```json ... ``` or ``` ... ``` block
        start_fence = text.find("```")
        if start_fence != -1:
            end_fence = text.rfind("```")
            if end_fence > start_fence:
                inner = text[start_fence:end_fence + 3]
                first_newline = inner.find("\n")
                if first_newline != -1:
                    code_body = inner[first_newline: -3].strip()
                    try:
                        return json.loads(code_body)
                    except json.JSONDecodeError:
                        pass

        # 3. Find first { or [ to last } or ]
        obj_start = text.find("{")
        arr_start = text.find("[")

        first_char = -1
        if obj_start != -1 and arr_start != -1:
            first_char = min(obj_start, arr_start)
        elif obj_start != -1:
            first_char = obj_start
        elif arr_start != -1:
            first_char = arr_start

        if first_char != -1:
            if text[first_char] == "{":
                last_char = text.rfind("}")
            else:
                last_char = text.rfind("]")

            if last_char > first_char:
                candidate = text[first_char : last_char + 1]
                try:
                    return json.loads(candidate)
                except json.JSONDecodeError:
                    pass

        return None

    def _mock_response(self, prompt: str) -> str:
        """Fallback mock text when API quota is exhausted or unconfigured."""
        return f'[VERITAS SYSTEM] Processed analysis for query: "{prompt[:120]}..."'
