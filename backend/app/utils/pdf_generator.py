"""
PDF Generator for Veritas Research reports.
Generates professional downloadable PDF reports containing:
- Document header & branding
- Research Query / Verified Topic
- Overall Verified Answer & Confidence Score
- Claim-by-claim breakdown with verdicts & confidence percentages
- Sources used with credibility scores
"""

import io
from datetime import datetime
from typing import Any, Dict, List, Optional


def generate_report_pdf(session_data: Dict[str, Any]) -> bytes:
    """
    Generate PDF bytes for a research session report using ReportLab.
    Falls back gracefully if reportlab is missing or errors out.
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

        # Custom styles
        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Heading1"],
            fontSize=22,
            leading=26,
            textColor=colors.HexColor("#0f172a"),
            fontName="Helvetica-Bold",
            spaceAfter=6,
        )

        subtitle_style = ParagraphStyle(
            "DocSubTitle",
            parent=styles["Normal"],
            fontSize=10,
            leading=13,
            textColor=colors.HexColor("#64748b"),
            fontName="Helvetica",
            spaceAfter=12,
        )

        section_heading = ParagraphStyle(
            "SectionHeading",
            parent=styles["Heading2"],
            fontSize=13,
            leading=16,
            textColor=colors.HexColor("#1e293b"),
            fontName="Helvetica-Bold",
            spaceBefore=12,
            spaceAfter=8,
        )

        body_style = ParagraphStyle(
            "BodyTextCustom",
            parent=styles["Normal"],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#334155"),
            fontName="Helvetica",
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
            fontSize=9,
            leading=11,
            fontName="Helvetica-Bold",
            textColor=colors.HexColor("#047857"),
        )

        badge_disputed = ParagraphStyle(
            "BadgeDisputed",
            parent=styles["Normal"],
            fontSize=9,
            leading=11,
            fontName="Helvetica-Bold",
            textColor=colors.HexColor("#b45309"),
        )

        badge_unverified = ParagraphStyle(
            "BadgeUnverified",
            parent=styles["Normal"],
            fontSize=9,
            leading=11,
            fontName="Helvetica-Bold",
            textColor=colors.HexColor("#be123c"),
        )

        story = []

        # 1. Header Banner
        story.append(Paragraph("Veritas Research — Verification Report", title_style))

        session_id = session_data.get("id", "N/A")
        created_at = session_data.get("created_at") or datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
        story.append(Paragraph(f"Report ID: {session_id}  |  Generated: {created_at}", subtitle_style))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#e2e8f0"), spaceAfter=14))

        # 2. Query / Topic
        query = session_data.get("query", "N/A")
        story.append(Paragraph("<b>Topic / Query:</b>", section_heading))
        story.append(Paragraph(f"<i>\"{query}\"</i>", body_style))
        story.append(Spacer(1, 10))

        # 3. Verified Answer Hero Section
        final_report = session_data.get("final_report") or {}
        synthesis = final_report.get("synthesis") or session_data.get("synthesis") or ""
        confidence = session_data.get("confidence_score") or final_report.get("confidence_score") or 0.75
        conf_pct = int(confidence * 100)

        answer_text = synthesis.split("\n\n")[0] if synthesis else "Multi-agent fact check analysis completed."

        answer_box_data = [
            [
                Paragraph("<b>Verified Overview Answer:</b>", bold_body),
                Paragraph(f"<b>Overall Confidence: {conf_pct}%</b>", bold_body),
            ],
            [
                Paragraph(answer_text, body_style),
                Paragraph(f"{'High Confidence' if conf_pct >= 75 else 'Medium Confidence' if conf_pct >= 40 else 'Low Confidence'}", subtitle_style),
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
        story.append(Spacer(1, 14))

        # 4. Claim-by-Claim Verification Breakdown Table
        claims = session_data.get("claims", [])
        if claims:
            story.append(Paragraph("Claim-by-Claim Verification Breakdown", section_heading))

            table_data = [
                [
                    Paragraph("<b>#</b>", bold_body),
                    Paragraph("<b>Claim</b>", bold_body),
                    Paragraph("<b>Verdict</b>", bold_body),
                    Paragraph("<b>Confidence Score</b>", bold_body),
                    Paragraph("<b>Explanation</b>", bold_body),
                ]
            ]

            for i, c in enumerate(claims, 1):
                claim_text = c.get("claim_text") or c.get("claim") or ""
                verdict = (c.get("verdict") or "unverified").lower()
                c_score = c.get("confidence_score")
                c_pct = f"{int(c_score * 100)}%" if c_score is not None else "N/A"
                exp = c.get("explanation") or ""

                if verdict == "verified":
                    v_para = Paragraph(f"✓ VERIFIED", badge_verified)
                elif verdict == "disputed":
                    v_para = Paragraph(f"⚠ DISPUTED", badge_disputed)
                else:
                    v_para = Paragraph(f"? UNVERIFIED", badge_unverified)

                table_data.append([
                    Paragraph(str(i), body_style),
                    Paragraph(claim_text, body_style),
                    v_para,
                    Paragraph(c_pct, bold_body),
                    Paragraph(exp, body_style),
                ])

            claims_table = Table(table_data, colWidths=[24, 150, 80, 76, 210])
            claims_table.setStyle(
                TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                    ("PADDING", (0, 0), (-1, -1), 6),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ])
            )
            story.append(claims_table)
            story.append(Spacer(1, 14))

        # 5. Sources Used
        sources = session_data.get("sources", [])
        if sources:
            story.append(Paragraph("Verified Sources Used", section_heading))
            src_items = []
            for s in sources[:10]:
                title = s.get("title") or s.get("url")
                url = s.get("url") or ""
                cred = s.get("credibility_score") or 0.8
                src_items.append(Paragraph(f"• <b>{title}</b> ({url}) — Trust Score: {int(cred * 100)}%", body_style))
            
            for item in src_items:
                story.append(item)
                story.append(Spacer(1, 3))

            story.append(Spacer(1, 12))

        # 6. Footer branding
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0"), spaceBefore=10, spaceAfter=8))
        story.append(Paragraph("Verified by Veritas Multi-Agent AI Research System  |  https://veritas-research.vercel.app", subtitle_style))

        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()

    except Exception as err:
        # Fallback simple text-PDF generation if reportlab styles fail or unexpected exception occurs
        buffer = io.BytesIO()
        content = (
            f"VERITAS RESEARCH REPORT\n"
            f"Session ID: {session_data.get('id')}\n"
            f"Query: {session_data.get('query')}\n"
            f"Confidence: {int((session_data.get('confidence_score') or 0.8)*100)}%\n\n"
            f"Full Report:\n{session_data.get('synthesis', '')}\n"
        )
        buffer.write(content.encode("utf-8"))
        buffer.seek(0)
        return buffer.getvalue()
