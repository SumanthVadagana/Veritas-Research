"""
PDF Analysis Router for Veritas Research.
POST /api/analyze-pdf — Accepts PDF upload, extracts text, splits into claims,
and auto-creates a research session for the full fact-check pipeline.
"""

import io
import logging
import uuid

import google.generativeai as genai
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.agents.base import BaseAgent
from app.config import settings
from app.database import AsyncSessionLocal
from app.models import ResearchSession

logger = logging.getLogger(__name__)

router = APIRouter(tags=["pdf-analysis"])

MAX_FILE_SIZE_MB = 20
MAX_PAGES = 50  # Protect against huge documents


# ── PDF text extraction ───────────────────────────────────────────────────────

def extract_text_from_pdf(pdf_bytes: bytes) -> dict:
    """
    Extract raw text from PDF bytes using pypdf.
    Returns dict with: text, page_count, char_count, pages (list of per-page text).
    """
    try:
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(pdf_bytes))
        page_count = len(reader.pages)
        pages_text = []

        for i, page in enumerate(reader.pages[:MAX_PAGES]):
            try:
                page_text = page.extract_text() or ""
                pages_text.append(page_text.strip())
            except Exception as e:
                logger.warning("Failed to extract page %d: %s", i + 1, e)
                pages_text.append("")

        full_text = "\n\n".join(p for p in pages_text if p)

        return {
            "text": full_text,
            "page_count": page_count,
            "extracted_pages": len(pages_text),
            "char_count": len(full_text),
            "pages": pages_text,
        }
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="PDF processing library not available. Please contact support.",
        )
    except Exception as e:
        logger.error("PDF extraction error: %s", e)
        raise HTTPException(status_code=422, detail=f"Failed to read PDF: {str(e)}")


# ── Gemini claim extraction ───────────────────────────────────────────────────

PDF_CLAIM_EXTRACTION_PROMPT = """You are an expert fact-checker and document analyst.

A user has uploaded a PDF document. Your job is to:
1. Understand the document's main topic and purpose
2. Extract the most important, fact-checkable claims and statements from the text
3. Create a concise research query that captures what needs to be verified

Return ONLY a valid JSON object:
{
  "document_title": "Inferred or extracted document title",
  "document_type": "news article | research paper | social media post | government document | report | other",
  "main_topic": "One sentence describing what this document is about",
  "research_query": "A clear, comprehensive question that captures the main claim(s) to fact-check. This will be sent to the multi-agent fact-verification pipeline.",
  "key_claims": [
    {
      "claim": "Specific verifiable claim from the document",
      "importance": "high | medium | low",
      "page_hint": 1
    }
  ],
  "summary": "2-3 sentence summary of the document's key assertions",
  "red_flags": ["Any suspicious or potentially false statements noticed"],
  "language": "detected language of the document",
  "word_count_estimate": 1250
}

Extract at most 8 key_claims. Focus on claims that can be fact-checked against external sources.
The research_query should be specific and searchable."""


async def extract_claims_with_gemini(text: str, filename: str) -> dict:
    """Use Gemini to intelligently extract claims and create a research query from PDF text with multi-key failover."""
    keys = []
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "demo":
        keys.append(settings.GEMINI_API_KEY)
    if settings.GEMINI_API_KEY_2 and settings.GEMINI_API_KEY_2 != "demo":
        keys.append(settings.GEMINI_API_KEY_2)

    if not keys:
        lines = [l.strip() for l in text.split("\n") if len(l.strip()) > 40][:5]
        return {
            "document_title": filename.replace(".pdf", "").replace("_", " ").title(),
            "document_type": "other",
            "main_topic": "Document analysis (demo mode)",
            "research_query": text[:500] if text else "No text extracted",
            "key_claims": [{"claim": l, "importance": "medium", "page_hint": 1} for l in lines[:5]],
            "summary": "Demo mode active.",
            "red_flags": [],
            "language": "unknown",
            "word_count_estimate": len(text.split()),
        }

    truncated_text = text[:8000]
    if len(text) > 8000:
        truncated_text += f"\n\n[... document continues, total {len(text)} characters ...]"

    user_prompt = (
        f"Filename: {filename}\n\n"
        f"Document Text:\n{truncated_text}\n\n"
        f"{PDF_CLAIM_EXTRACTION_PROMPT}"
    )

    last_error = None
    for key_index, key in enumerate(keys):
        try:
            genai.configure(api_key=key)
            model = genai.GenerativeModel(
                model_name=settings.GEMINI_FLASH_MODEL,
                system_instruction="You are an expert fact-checker. Always return valid JSON only.",
            )

            response = await model.generate_content_async(
                user_prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=1500,
                    temperature=0.1,
                ),
            )

            parsed = BaseAgent.extract_json(response.text)
            if parsed and isinstance(parsed, dict):
                return parsed

        except Exception as exc:
            last_error = exc
            logger.warning("PDF Gemini Key #%d failed: %s", key_index + 1, exc)
            if key_index < len(keys) - 1:
                logger.info("Switching to secondary Gemini API key for PDF analysis...")
                continue

    return _fallback_claims(text, filename)



def _fallback_claims(text: str, filename: str) -> dict:
    """Basic fallback when Gemini analysis fails."""
    sentences = [s.strip() for s in text.replace("\n", " ").split(".") if len(s.strip()) > 50]
    claims = [
        {"claim": s + ".", "importance": "medium", "page_hint": 1}
        for s in sentences[:6]
    ]
    return {
        "document_title": filename.replace(".pdf", "").replace("_", " ").title(),
        "document_type": "other",
        "main_topic": "Document content analysis",
        "research_query": text[:600] if text else "No text extracted from PDF",
        "key_claims": claims,
        "summary": "Automated text extraction completed. Claim analysis unavailable.",
        "red_flags": [],
        "language": "unknown",
        "word_count_estimate": len(text.split()),
    }


# ── Router ────────────────────────────────────────────────────────────────────

@router.post("/analyze-pdf")
async def analyze_pdf(
    file: UploadFile = File(..., description="PDF file to analyze and fact-check"),
):
    """
    Upload a PDF for automated claim extraction + fact-check pipeline.
    Steps:
    1. Extract all text using pypdf
    2. Use Gemini to identify key claims and build a research query
    3. Auto-create a research session
    Returns: extracted claims, research_query, session_id to stream fact-check results
    """
    # Validate file type
    content_type = file.content_type or ""
    filename = file.filename or "document.pdf"

    if content_type not in ("application/pdf", "application/octet-stream") and not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=415,
            detail="Only PDF files are supported. Please upload a .pdf file.",
        )

    # Read PDF bytes
    pdf_bytes = await file.read()

    # Validate file size
    size_mb = len(pdf_bytes) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"PDF too large: {size_mb:.1f} MB. Maximum allowed: {MAX_FILE_SIZE_MB} MB",
        )

    if len(pdf_bytes) < 100:
        raise HTTPException(status_code=422, detail="File appears to be empty or corrupted.")

    # 1. Extract text from PDF
    pdf_data = extract_text_from_pdf(pdf_bytes)
    extracted_text = pdf_data["text"]
    page_count = pdf_data["page_count"]

    if not extracted_text or len(extracted_text.strip()) < 20:
        raise HTTPException(
            status_code=422,
            detail=(
                "Could not extract readable text from this PDF. "
                "The PDF may be scanned/image-based or encrypted. "
                "Try uploading via the Image Upload tab for scanned documents."
            ),
        )

    # 2. Use Gemini to extract claims and build research query
    analysis = await extract_claims_with_gemini(extracted_text, filename)

    research_query = analysis.get("research_query") or extracted_text[:600]
    key_claims = analysis.get("key_claims", [])

    # 3. Auto-create a research session for the extracted content
    session_id = None
    if len(research_query.strip()) >= 10:
        async with AsyncSessionLocal() as db:
            session_id = str(uuid.uuid4())
            # Truncate to DB column limit
            query_text = research_query[:1000]
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
            "filename": filename,
            "page_count": page_count,
            "char_count": pdf_data["char_count"],
            "word_count": analysis.get("word_count_estimate", len(extracted_text.split())),
            "document_title": analysis.get("document_title", filename),
            "document_type": analysis.get("document_type", "other"),
            "main_topic": analysis.get("main_topic", ""),
            "summary": analysis.get("summary", ""),
            "research_query": research_query,
            "key_claims": key_claims,
            "red_flags": analysis.get("red_flags", []),
            "language": analysis.get("language", "unknown"),
            "extracted_text_preview": extracted_text[:1000],
            "fact_checkable": bool(session_id),
        }
    )
