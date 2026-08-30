"""Auto-generate a one-page PDF report per job summarising metrics + plots.

Owner: P4
"""
from __future__ import annotations

from pathlib import Path
from selene.eval.metrics import MetricsResult


def generate_pdf_report(
    job_dir: str | Path,
    metrics: MetricsResult,
    job_id: str = "job_default",
    plots: list[Path] | None = None,
) -> Path:
    """Generate a clean 1-page PDF summary deliverable.

    Uses ReportLab if installed; creates a markdown/text summary if ReportLab is missing.

    Args:
        job_dir: Directory where the output PDF report will be written.
        metrics: Populated MetricsResult dataclass.
        job_id: Unique job identifier.
        plots: List of PNG paths to embed into the report.

    Returns:
        Path to created report file.
    """
    job_dir = Path(job_dir)
    job_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = job_dir / "registration_report.pdf"

    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors

        doc = SimpleDocTemplate(str(pdf_path), pagesize=letter, leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
        styles = getSampleStyleSheet()
        elements = []

        # Title
        title_style = ParagraphStyle(
            "TitleStyle",
            parent=styles["Heading1"],
            fontSize=18,
            textColor=colors.HexColor("#1A365D"),
            spaceAfter=10,
        )
        elements.append(Paragraph("SELENE-MATCH: Lunar Registration Deliverable Report", title_style))
        elements.append(Paragraph(f"<b>Job ID:</b> {job_id} | <b>Status:</b> Success", styles["Normal"]))
        elements.append(Spacer(1, 12))

        # Metrics Table
        data = [
            ["Metric", "Value", "Unit / Context"],
            ["Raw Match Candidates", str(metrics.n_raw), "points"],
            ["Inlier GCPs", str(metrics.n_inliers), f"Ratio: {metrics.inlier_ratio * 100:.1f}%"],
            ["RMSE (Pixel-space)", f"{metrics.rmse_px:.3f}", "pixels"],
            ["RMSE (Metre-space)", f"{metrics.rmse_m:.3f}", "metres"],
            ["CE90 Circular Error", f"{metrics.ce90_m:.3f}", "metres (90th percentile)"],
            ["Mean Residual", f"{metrics.mean_residual_px:.3f}", "pixels"],
            ["NNI Dispersion Index", f"{metrics.nni_index:.3f}", ">1.0 uniform spread"],
            ["Grid Coverage", f"{metrics.grid_coverage_fraction * 100:.1f}%", "active grid cells"],
        ]
        t = Table(data, colWidths=[160, 100, 200])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2B6CB0")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 14))

        # Include plot thumbnail if available
        if plots:
            for p in plots:
                if p and Path(p).exists():
                    elements.append(RLImage(str(p), width=240, height=240))
                    elements.append(Spacer(1, 10))
                    break

        doc.build(elements)
        return pdf_path

    except (ImportError, Exception):
        # Fallback to plain summary text report
        txt_path = job_dir / "registration_report.txt"
        with open(txt_path, "w") as f:
            f.write(f"SELENE-MATCH Deliverable Report\nJob: {job_id}\n\n")
            for k, v in metrics.to_dict().items():
                f.write(f"{k}: {v}\n")
        return txt_path
