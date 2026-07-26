"""
Image Analysis Router for Veritas Research.
POST /api/analyze-image — Accepts image upload, extracts text via Gemini Vision,
computes a Realness Score, and auto-creates a research session.
"""

import base64
import logging
import uuid

import google.generativeai as genai
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import AsyncSessionLocal
from app.models import ResearchSession

logger = logging.getLogger(__name__)

router = APIRouter(tags=["image-analysis"])

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"}
MAX_FILE_SIZE_MB = 10


IMAGE_ANALYSIS_PROMPT = """You are an expert forensic image analyst and OCR specialist.

Analyze this image and return a JSON object with EXACTLY these fields:

{
  "extracted_text": "All text visible in the image, extracted verbatim. Include all text from signs, captions, watermarks, messages, etc. If no text is found, return empty string.",
  "image_description": "One paragraph describing what the image shows (people, objects, scene, context).",
  "realness_score": 78,
  "realness_label": "Likely Real",
  "manipulation_signals": ["List of specific signals that suggest manipulation or AI generation, e.g. 'unnatural lighting', 'blurry edges around subjects', 'inconsistent shadows'. Empty list if none found."],
  "ai_generation_indicators": ["Specific AI-generation artifacts if detected. Empty list if image appears genuine."],
  "metadata_notes": "Any observations about image quality, compression artifacts, or authenticity markers.",
  "content_warnings": ["Any concerning content types: 'misinformation', 'hate speech', 'adult content', etc. Empty list if clean."],
  "fact_checkable": true
}

REALNESS SCORE GUIDE:
- 90-100: Almost certainly genuine photo
- 70-89: Likely real, minor concerns
- 50-69: Uncertain, some manipulation signals
- 30-49: Likely manipulated or AI-generated
- 0-29: Almost certainly AI-generated or heavily manipulated

REALNESS LABEL must be one of: "Genuine", "Likely Real", "Uncertain", "Likely Manipulated", "AI-Generated"

Return ONLY the JSON object, no extra text."""


async def analyze_image_with_gemini(image_bytes: bytes, mime_type: str) -> dict:
    """Use Gemini Vision to analyze image, extract text and compute realness score."""
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "demo":
        # Demo fallback
        return {
            "extracted_text": "Demo mode: Set GEMINI_API_KEY to enable real OCR and image analysis.",
            "image_description": "Image analysis requires a valid Gemini API key.",
            "realness_score": 50,
            "realness_label": "Uncertain",
            "manipulation_signals": [],
            "ai_generation_indicators": [],
            "metadata_notes": "Running in demo mode.",
            "content_warnings": [],
            "fact_checkable": False,
        }

    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)

        model = genai.GenerativeModel(
            model_name=settings.GEMINI_FLASH_MODEL,
            system_instruction="You are an expert forensic image analyst. Always return valid JSON only.",
        )

        # Encode image as base64 for inline data
        image_b64 = base64.b64encode(image_bytes).decode("utf-8")

        image_part = {
            "inline_data": {
                "mime_type": mime_type,
                "data": image_b64,
            }
        }

        response = await model.generate_content_async(
            [IMAGE_ANALYSIS_PROMPT, image_part],
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=1500,
                temperature=0.1,
            ),
        )

        raw_text = response.text

        # Parse JSON from response
        from app.agents.base import BaseAgent
        parsed = BaseAgent.extract_json(raw_text)
        if parsed and isinstance(parsed, dict):
            return parsed

        logger.warning("Gemini image analysis returned non-JSON: %s", raw_text[:200])
        return _fallback_analysis(raw_text)

    except Exception as exc:
        logger.error("Gemini image analysis error: %s", exc)
        return _fallback_analysis("")


def _fallback_analysis(raw_text: str) -> dict:
    return {
        "extracted_text": raw_text[:1000] if raw_text else "",
        "image_description": "Image analysis completed but structured parsing failed.",
        "realness_score": 50,
        "realness_label": "Uncertain",
        "manipulation_signals": [],
        "ai_generation_indicators": [],
        "metadata_notes": "Analysis partially completed.",
        "content_warnings": [],
        "fact_checkable": bool(raw_text),
    }


@router.post("/analyze-image")
async def analyze_image(
    file: UploadFile = File(..., description="Image file to analyze"),
):
    """
    Upload an image for OCR + fact-check analysis.
    - Extracts all text using Gemini Vision
    - Computes an Image Realness Score (AI-generation / manipulation detection)
    - Auto-creates a research session for the extracted text
    Returns: extracted_text, realness_score, session_id to stream fact-check results
    """
    # Validate file type
    content_type = file.content_type or ""
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type: {content_type}. Allowed: JPEG, PNG, WebP, GIF, BMP",
        )

    # Read image bytes
    image_bytes = await file.read()

    # Validate file size
    size_mb = len(image_bytes) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"File too large: {size_mb:.1f} MB. Maximum allowed: {MAX_FILE_SIZE_MB} MB",
        )

    # Run Gemini Vision analysis
    analysis = await analyze_image_with_gemini(image_bytes, content_type)

    extracted_text = analysis.get("extracted_text", "").strip()
    realness_score = int(analysis.get("realness_score", 50))
    realness_label = analysis.get("realness_label", "Uncertain")

    # Auto-create a research session if we have text to fact-check
    session_id = None
    if extracted_text and len(extracted_text) >= 10 and analysis.get("fact_checkable", True):
        async with AsyncSessionLocal() as db:
            session_id = str(uuid.uuid4())
            # Truncate text for query field (max 500 chars)
            query_text = extracted_text[:500]
            session = ResearchSession(
                id=session_id,
                query=query_text,
                depth=3,
                status="pending",
            )
            db.add(session)
            await db.commit()

    return JSONResponse(
        content={
            "session_id": session_id,
            "extracted_text": extracted_text,
            "has_text": bool(extracted_text and len(extracted_text) >= 10),
            "image_description": analysis.get("image_description", ""),
            "realness_score": realness_score,
            "realness_label": realness_label,
            "manipulation_signals": analysis.get("manipulation_signals", []),
            "ai_generation_indicators": analysis.get("ai_generation_indicators", []),
            "metadata_notes": analysis.get("metadata_notes", ""),
            "content_warnings": analysis.get("content_warnings", []),
            "fact_checkable": bool(session_id),
        }
    )
