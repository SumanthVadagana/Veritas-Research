"""
PDF Generator for Veritas Research reports.
Generates comprehensive multi-page PDF reports containing:
- Executive Summary & Overall Verified Answer
- Master Confidence Score & Verdict
- Claim-by-Claim Breakdown Table
- Full Multi-Section Synthesis Research Report
- Source Links with Credibility Scores
"""

import html
import io
import re
from datetime import datetime
from typing import Any, Dict, List, Optional


def clean_txt(text: Any) -> str:
    """Escape XML characters (&, <, >) to prevent ReportLab XML parser crashes."""
    if text is None:
        return ""
    s = str(text)
    # Strip markdown bold/italic tags for clean pdf rendering
    s = re.sub(r"\*\*|__|\*|_", "", s)
    return html.escape(s)


def generate_report_pdf(session_data: Dict[str, Any]) -> bytes:
    """
    Generate complete PDF bytes for a research session report using ReportLab.
    """
    buffer = io.BytesIO()

    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
        from reportlab.platypus import (
            HRFlowable,
            KeepTogether,
            Paragraph,
            SimpleDocTemplate,
            Spacer,
            Table,
            TableStyle,
        )

        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36,
        )

        styles = getSampleStyleSheet()

        # Styles
        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Heading1"],
            fontSize=20,
            leading=24,
            textColor=colors.HexColor("#0f172a"),
            fontName="Helvetica-Bold",
            spaceAfter=4,
        )

        subtitle_style = ParagraphStyle(
            "DocSubTitle",
            parent=styles["Normal"],
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#64748b"),
            fontName="Helvetica",
            spaceAfter=10,
        )

        section_heading = ParagraphStyle(
            "SectionHeading",
            parent=styles["Heading2"],
            fontSize=12,
            leading=15,
            textColor=colors.HexColor("#0f172a"),
            fontName="Helvetica-Bold",
            spaceBefore=12,
            spaceAfter=6,
        )

        body_style = ParagraphStyle(
            "BodyTextCustom",
            parent=styles["Normal"],
            fontSize=9.5,
            leading=13.5,
            textColor=colors.HexColor("#334155"),
            fontName="Helvetica",
            spaceAfter=6,
        )

        bold_body = ParagraphStyle(
            "BoldBodyCustom",
            parent=body_style,
            fontName="Helvetica-Bold",
            textColor=colors.HexColor("#0f172a"),
        )

        badge_verified = ParagraphStyle(
            "BadgeVerified",
            parent=styles["Normal"],
            fontSize=8.5,
            leading=10,
            fontName="Helvetica-Bold",
            textColor=colors.HexColor("#047857"),
        )

        badge_disputed = ParagraphStyle(
            "BadgeDisputed",
            parent=styles["Normal"],
            fontSize=8.5,
            leading=10,
            fontName="Helvetica-Bold",
            textColor=colors.HexColor("#b45309"),
        )

        badge_unverified = ParagraphStyle(
            "BadgeUnverified",
            parent=styles["Normal"],
            fontSize=8.5,
            leading=10,
            fontName="Helvetica-Bold",
            textColor=colors.HexColor("#be123c"),
        )

        story = []

        # 1. Header & Branding
        story.append(Paragraph("Veritas Research — Verification Report", title_style))
        session_id = clean_txt(session_data.get("id", "N/A"))
        created_at = clean_txt(session_data.get("created_at") or datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"))
        story.append(Paragraph(f"Report Session ID: {session_id}  |  Date: {created_at}", subtitle_style))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#e2e8f0"), spaceAfter=10))

        # 2. Query / Topic
        query = clean_txt(session_data.get("query", "N/A"))
        story.append(Paragraph("<b>Topic / Question Verified:</b>", section_heading))
        story.append(Paragraph(f"<i>\"{query}\"</i>", body_style))
        story.append(Spacer(1, 6))

        # 3. Verified Answer Hero Section
        final_report = session_data.get("final_report") or {}
        synthesis_raw = session_data.get("synthesis") or final_report.get("synthesis") or ""
        verified_answer_raw = session_data.get("verified_answer") or final_report.get("verified_answer")
        
        if not verified_answer_raw and synthesis_raw:
            verified_answer_raw = synthesis_raw.split("\n\n")[0]
        if not verified_answer_raw:
            verified_answer_raw = f"Verification report generated for: {query}"

        confidence = session_data.get("confidence_score") or final_report.get("confidence_score") or 0.80
        conf_pct = int(confidence * 100)

        conf_label = "High Confidence (≥75%)" if conf_pct >= 75 else "Medium Confidence (40-74%)" if conf_pct >= 40 else "Low Confidence (<40%)"

        answer_box_data = [
            [
                Paragraph("<b>VERIFIED ANSWER & VERDICT</b>", bold_body),
                Paragraph(f"<b>Overall Score: {conf_pct}%</b>", bold_body),
            ],
            [
                Paragraph(clean_txt(verified_answer_raw), body_style),
                Paragraph(clean_txt(conf_label), subtitle_style),
            ],
        ]
        answer_table = Table(answer_box_data, colWidths=[380, 160])
        answer_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
                ("PADDING", (0, 0), (-1, -1), 8),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ])
        )
        story.append(answer_table)
        story.append(Spacer(1, 10))

        # 4. Claim-by-Claim Breakdown Table
        claims = session_data.get("claims", [])
        if claims:
            story.append(Paragraph("Claim-by-Claim Verification Breakdown", section_heading))

            table_data = [
                [
                    Paragraph("<b>#</b>", bold_body),
                    Paragraph("<b>Claim Statement</b>", bold_body),
                    Paragraph("<b>Verdict</b>", bold_body),
                    Paragraph("<b>Score</b>", bold_body),
                    Paragraph("<b>Explanation & Evidence</b>", bold_body),
                ]
            ]

            for i, c in enumerate(claims, 1):
                claim_text = clean_txt(c.get("claim_text") or c.get("claim") or "")
                verdict = (c.get("verdict") or "unverified").lower()
                c_score = c.get("confidence_score")
                c_pct = f"{int(c_score * 100)}%" if c_score is not None else "N/A"
                exp = clean_txt(c.get("explanation") or "")

                if verdict == "verified":
                    v_para = Paragraph("✓ VERIFIED", badge_verified)
                elif verdict == "disputed":
                    v_para = Paragraph("⚠ DISPUTED", badge_disputed)
                else:
                    v_para = Paragraph("? UNVERIFIED", badge_unverified)

                table_data.append([
                    Paragraph(str(i), body_style),
                    Paragraph(claim_text, body_style),
                    v_para,
                    Paragraph(c_pct, bold_body),
                    Paragraph(exp, body_style),
                ])

            claims_table = Table(table_data, colWidths=[20, 140, 75, 55, 250])
            claims_table.setStyle(
                TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                    ("PADDING", (0, 0), (-1, -1), 5),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ])
            )
            story.append(claims_table)
            story.append(Spacer(1, 10))

        # 5. Full Multi-Section Synthesis Research Report
        if synthesis_raw:
            story.append(Paragraph("Full Synthesis Research Report", section_heading))
            
            # Format markdown paragraphs into PDF flowables
            paragraphs = synthesis_raw.split("\n\n")
            for block in paragraphs:
                block_clean = block.strip()
                if not block_clean:
                    continue

                if block_clean.startswith("## "):
                    heading_txt = clean_txt(block_clean.replace("## ", ""))
                    story.append(Paragraph(f"<b>{heading_txt}</b>", section_heading))
                elif block_clean.startswith("# "):
                    heading_txt = clean_txt(block_clean.replace("# ", ""))
                    story.append(Paragraph(f"<b>{heading_txt}</b>", section_heading))
                elif block_clean.startswith("- ") or block_clean.startswith("• "):
                    items = block_clean.split("\n")
                    for item in items:
                        item_clean = clean_txt(re.sub(r"^[-•]\s*", "", item.strip()))
                        story.append(Paragraph(f"• {item_clean}", body_style))
                else:
                    story.append(Paragraph(clean_txt(block_clean), body_style))

            story.append(Spacer(1, 10))

        # 6. Verified Sources Used
        sources = session_data.get("sources", [])
        if sources:
            story.append(Paragraph("Verified Sources Used", section_heading))
            for s in sources[:12]:
                title = clean_txt(s.get("title") or s.get("url") or "Web Source")
                url = clean_txt(s.get("url") or "")
                cred = s.get("credibility_score") or s.get("relevance_score") or 0.8
                cred_pct = int(cred * 100)
                story.append(Paragraph(f"• <b>{title}</b> — <i>{url}</i> (Trust Score: {cred_pct}%)", body_style))

            story.append(Spacer(1, 8))

        # 7. Footer
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0"), spaceBefore=8, spaceAfter=6))
        story.append(Paragraph("Verified by Veritas Multi-Agent AI System  |  https://veritas-research.vercel.app", subtitle_style))

        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()

    except Exception as err:
        # Fallback simple text-PDF generation if reportlab styles fail or unexpected exception occurs
        buffer = io.BytesIO()
        query = session_data.get("query", "N/A")
        synthesis = session_data.get("synthesis", "")
        content = (
            f"VERITAS RESEARCH REPORT\n"
            f"Session ID: {session_data.get('id')}\n"
            f"Query: {query}\n"
            f"Confidence: {int((session_data.get('confidence_score') or 0.8)*100)}%\n\n"
            f"Full Report:\n{synthesis}\n"
        )
        buffer.write(content.encode("utf-8"))
        buffer.seek(0)
        return buffer.getvalue()
