"""Generate comprehensive PDF report for ISRO PS 26166 Implementation and UI/UX Design Specifications.

Usage:
    python scripts/generate_specification_pdf.py
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    HRFlowable,
    KeepTogether,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas


class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to dynamically compute total page count and add running footer."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count: int):
        self.saveState()
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#64748B"))

        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(36, 756, "SELENE-MATCH — ISRO PS 26166 Implementation & UI/UX Specification")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(36, 748, 576, 748)

        # Footer (all pages)
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(36, 45, 576, 45)

        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(576, 30, page_str)
        self.drawString(36, 30, "CONFIDENTIAL — Smart India Hackathon 2026 · ISRO / Department of Space")
        self.restoreState()


def build_pdf(filename: str | Path):
    doc = SimpleDocTemplate(
        str(filename),
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=54,
        bottomMargin=54,
    )

    styles = getSampleStyleSheet()

    # Custom Color Palette
    PRIMARY = colors.HexColor("#0F172A")       # Deep Slate 900
    SECONDARY = colors.HexColor("#1E293B")     # Slate 800
    ACCENT_BLUE = colors.HexColor("#0284C7")   # ISRO Sky Blue
    ACCENT_GREEN = colors.HexColor("#10B981")  # Success Emerald
    WARN_AMBER = colors.HexColor("#F59E0B")    # Warning Amber
    TEXT_DARK = colors.HexColor("#1E293B")     # Main Text
    TEXT_MUTED = colors.HexColor("#475569")    # Secondary Text
    BG_LIGHT = colors.HexColor("#F8FAFC")      # Light Card Fill

    # Paragraph Styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=PRIMARY,
        spaceAfter=4,
    )

    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=11,
        leading=14,
        textColor=ACCENT_BLUE,
        spaceAfter=14,
    )

    h1_style = ParagraphStyle(
        "SectionH1",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=PRIMARY,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True,
    )

    h2_style = ParagraphStyle(
        "SectionH2",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=15,
        textColor=ACCENT_BLUE,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True,
    )

    body_style = ParagraphStyle(
        "BodyDark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=13.5,
        textColor=TEXT_DARK,
        spaceAfter=6,
    )

    bullet_style = ParagraphStyle(
        "BulletText",
        parent=body_style,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=3,
    )

    code_style = ParagraphStyle(
        "CodeText",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=8.5,
        leading=11,
        textColor=SECONDARY,
    )

    elements = []

    # ── Document Header Banner ──────────────────────────────────────────────
    elements.append(Paragraph("SELENE-MATCH — Technical & UI/UX Specification Report", title_style))
    elements.append(Paragraph("<b>Problem Statement ID 26166:</b> Multi-modal, Sun angle and scale invariant image correspondence using Chandrayaan-2 optical images (OHRC, TMC and IIRS)", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=ACCENT_BLUE, spaceBefore=0, spaceAfter=12))

    # ── Section 1: Executive Overview & Challenge Mapping ──────────────────
    elements.append(Paragraph("1. Executive Summary & ISRO PS 26166 Challenge Matrix", h1_style))
    elements.append(Paragraph(
        "SELENE-MATCH is a 100% free and open-source software stack designed to achieve sub-pixel, spatially uniform image correspondence between Chandrayaan-2 optical sensors (OHRC, TMC-2, IIRS) and lunar reference mosaics (LRO NAC/WAC). Below is the comprehensive matrix mapping ISRO's key challenges to our technical implementation.",
        body_style
    ))

    # Challenge Matrix Table
    matrix_data = [
        [Paragraph("<b>Challenge / Requirement</b>", body_style), Paragraph("<b>Status</b>", body_style), Paragraph("<b>Implemented Technical Modules</b>", body_style)],
        [
            Paragraph("<b>1. Illumination Variation</b><br/>(Sun azimuth/elevation shifts, polarity flips)", body_style),
            Paragraph("<font color='#10B981'><b>100% Implemented</b></font>", body_style),
            Paragraph("Phase Congruency (Log-Gabor bank), DEM Lambertian relighting, Census transform, Dynamic percentile shadow masking, Crater graph matcher (k-NN relative topology), Azimuth-gated router.", body_style)
        ],
        [
            Paragraph("<b>2. Viewpoint Variation</b><br/>(Camera positions, tilt, perspective distortion)", body_style),
            Paragraph("<font color='#0284C7'><b>Implemented</b></font><br/>(Tier 2/3 Core)", body_style),
            Paragraph("MAGSAC++ robust homography/affine fit, Thin-Plate Spline (TPS) & Piecewise Affine non-rigid warps, 3D Selenographic SVD sphere model (Kabsch 3-DOF rotation).", body_style)
        ],
        [
            Paragraph("<b>3. Scale Variation</b><br/>(Altitudes & resolutions up to 320× ratio)", body_style),
            Paragraph("<font color='#10B981'><b>100% Implemented</b></font>", body_style),
            Paragraph("GSD Pyramid Builder & Resampling (<font name='Courier'>resample_to_gsd</font>), Equalized scale matching pipeline, Native coordinate upscaling (<font name='Courier'>upscale_coordinates</font>).", body_style)
        ],
        [
            Paragraph("<b>4. Sub-Pixel Accuracy</b>", body_style),
            Paragraph("<font color='#10B981'><b>100% Implemented</b></font>", body_style),
            Paragraph("Inverse-Compositional Lucas-Kanade (IC-LK) patch tracking (<font name='Courier'>subpixel_lk.py</font>) yielding sub-pixel refinement.", body_style)
        ],
        [
            Paragraph("<b>5. Uniform GCP Distribution</b>", body_style),
            Paragraph("<font color='#10B981'><b>100% Implemented</b></font>", body_style),
            Paragraph("8×8 Grid occupancy sampler (<font name='Courier'>sample_uniform_gcps</font>) with shadow-aware cell exclusion, Clark-Evans NNI index, Grid Coverage %.", body_style)
        ],
        [
            Paragraph("<b>6. Registered Product & Metrics</b>", body_style),
            Paragraph("<font color='#10B981'><b>100% Implemented</b></font>", body_style),
            Paragraph("GeoTIFF export (<font name='Courier'>registered.tif</font>), Matches CSV (<font name='Courier'>matches.csv</font>), RMSE (px/m), CE90 (90th percentile), NNI Index, Grid Coverage %, Auto PDF report.", body_style)
        ],
    ]

    t_matrix = Table(matrix_data, colWidths=[130, 90, 320])
    t_matrix.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BG_LIGHT),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    elements.append(t_matrix)
    elements.append(Spacer(1, 10))

    # ── Section 2: Detailed Breakdown of Core Challenges & Scope ──────────
    elements.append(Paragraph("2. Detailed Technical Breakdown & Architectural Boundaries", h1_style))

    elements.append(Paragraph("Illumination Invariance Engine", h2_style))
    elements.append(Paragraph("• <b>Phase Congruency (Log-Gabor Bank):</b> Computes frequency-domain phase alignment across 3 scales and 4 orientations, extracting structural feature boundaries that remain invariant to solar illumination changes.", bullet_style))
    elements.append(Paragraph("• <b>Shadow Masking & Exclusion:</b> Dynamic percentile thresholding computes binary shadow masks (<font name='Courier'>detect_shadows</font>) to exclude pitch-black shadow regions from GCP sampling and LK tracking.", bullet_style))
    elements.append(Paragraph("• <b>Crater Graph Matcher:</b> Detects impact craters using Hough transform + rim gradient consistency scoring (<font name='Courier'>_rim_gradient_score</font>). Constructs k-NN geometric invariant graphs of relative distance and radius ratios that remain invariant under polarity flips.", bullet_style))

    elements.append(Paragraph("Scale Invariance & Pyramid Equalization Engine", h2_style))
    elements.append(Paragraph("• <b>GSD Pyramid Resampling:</b> Before feature matching, the moving and reference images are resampled to a common coarsest GSD (<font name='Courier'>common_gsd_m = max(ref_gsd, mov_gsd)</font>). This brings the effective GSD ratio to ~1.0, enabling standard feature matchers (LightGlue, SIFT, Phase Correlation) to succeed across extreme scale differences (e.g. OHRC 0.25m vs IIRS 80m).", bullet_style))
    elements.append(Paragraph("• <b>Coordinate Upscaling:</b> Candidate correspondences found at the coarse working scale are upscaled back to native resolution (<font name='Courier'>upscale_coordinates</font>) for fine sub-pixel refinement.", bullet_style))

    elements.append(Paragraph("Viewpoint & Geometric Warping Engine", h2_style))
    elements.append(Paragraph("• <b>MAGSAC++ Outlier Rejection:</b> Uses marginalizing sample consensus (<font name='Courier'>USAC_MAGSAC</font>) to fit robust homography/affine models and eliminate spurious matches.", bullet_style))
    elements.append(Paragraph("• <b>Non-Rigid TPS Warp:</b> Fits a Thin-Plate Spline (<font name='Courier'>warp_tps</font>) to model non-planar terrain deformations when ≥12 GCPs are validated.", bullet_style))
    elements.append(Paragraph("• <b>3D Selenographic SVD Model:</b> Projects 2D pixel coordinates to a 3D sphere of radius 1,737.4 km and solves 3-DOF rotation via Kabsch SVD algorithm for off-nadir/oblique views.", bullet_style))
    elements.append(Paragraph("• <i>Architectural Scope Limitation (Honest Boundary):</i> 3D DEM-based orthorectification to correct terrain relief displacement (parallax) on steep crater slopes is designated as an optional Tier-1 ISIS3/ASP stretch scope.", bullet_style))

    elements.append(Spacer(1, 10))

    # ── Section 3: Extra Features Implemented ─────────────────────────────
    elements.append(Paragraph("3. Extra Features Added (Beyond PS Requirements)", h1_style))

    elements.append(Paragraph("• <b>Gated Matcher Ensemble Router:</b> Dynamic decision table (<font name='Courier'>gate.py</font>) that automatically routes image pairs based on metadata: <font name='Courier'>crater_graph</font> for polar opposite sun angles (&Delta;az &gt; 60°), <font name='Courier'>mutual_info</font> for cross-modal hyper-spectral pairs (IIRS &leftrightarrow; TMC/WAC via SimpleITK), <font name='Courier'>phase_corr</font> for coarse alignment, and <font name='Courier'>lightglue</font> for same-sensor pairs.", bullet_style))
    elements.append(Paragraph("• <b>Auto-Discovery PDS Label Parser:</b> Automatically discovers and parses PDS3 <font name='Courier'>.lbl</font>, PDS4 <font name='Courier'>.xml</font>, and <font name='Courier'>.json</font> label files, with fallback heuristic inference of sensor IDs and native GSDs directly from filenames.", bullet_style))
    elements.append(Paragraph("• <b>Automated Verification Plotting Engine:</b> Automatically generates 3 diagnostic PNG plots per run: (1) 8×8 Checkerboard overlay, (2) GCP Residual vector quiver plot, and (3) GCP 2D spatial density heatmap.", bullet_style))
    elements.append(Paragraph("• <b>One-Page PDF Report Generator:</b> Auto-generates a deliverable PDF summary report (<font name='Courier'>registration_report.pdf</font>) containing job metadata, full metrics table, NNI dispersion index, grid coverage %, and visual overlays.", bullet_style))
    elements.append(Paragraph("• <b>Full REST API & Interactive Workbench UI:</b> Production-ready FastAPI backend paired with a modern Vite + React + TypeScript web workbench UI.", bullet_style))

    elements.append(PageBreak())

    # ── Section 4: Complete UI/UX Design & Specification ───────────────────
    elements.append(Paragraph("4. Comprehensive UI/UX Design & Interface Specifications", h1_style))

    elements.append(Paragraph("Design System & Visual Theme", h2_style))
    elements.append(Paragraph("The UI adopts a <b>Lunar Deep Space Dark Mode</b> visual hierarchy tailored for high-contrast geospatial analysis and venue demos.", body_style))

    color_specs = [
        [Paragraph("<b>Token Name</b>", body_style), Paragraph("<b>Hex Code</b>", body_style), Paragraph("<b>Role / Application</b>", body_style)],
        [Paragraph("Background (Canvas)", body_style), Paragraph("<font name='Courier'>#0F172A</font>", body_style), Paragraph("Slate 900 — Deep space dark background", body_style)],
        [Paragraph("Surface (Cards/Panels)", body_style), Paragraph("<font name='Courier'>#1E293B</font>", body_style), Paragraph("Slate 800 — Card containers, sidebar background", body_style)],
        [Paragraph("Primary Brand Accent", body_style), Paragraph("<font name='Courier'>#0284C7</font>", body_style), Paragraph("ISRO Sky Blue — Active tabs, primary buttons, borders", body_style)],
        [Paragraph("Success / Inliers", body_style), Paragraph("<font name='Courier'>#10B981</font>", body_style), Paragraph("Emerald Green — Verified GCPs, passed metrics, success badges", body_style)],
        [Paragraph("Warning / Outliers", body_style), Paragraph("<font name='Courier'>#F59E0B</font>", body_style), Paragraph("Amber Yellow — Outliers, high GSD ratio alerts", body_style)],
        [Paragraph("Text Primary", body_style), Paragraph("<font name='Courier'>#F8FAFC</font>", body_style), Paragraph("Slate 50 — Headings, key values", body_style)],
        [Paragraph("Text Secondary", body_style), Paragraph("<font name='Courier'>#94A3B8</font>", body_style), Paragraph("Slate 400 — Subtitles, labels, disabled states", body_style)],
    ]
    t_colors = Table(color_specs, colWidths=[130, 90, 320])
    t_colors.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BG_LIGHT),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(t_colors)
    elements.append(Spacer(1, 10))

    elements.append(Paragraph("Layout & Component Architecture", h2_style))
    elements.append(Paragraph("The UI is structured around a top navigation header and four primary functional view tabs:", body_style))

    # Tab Specifications Table
    tab_specs = [
        [Paragraph("<b>Tab / View</b>", body_style), Paragraph("<b>Key Layout Components & Interactive Controls</b>", body_style)],
        [
            Paragraph("<b>1. PairDesk</b><br/>(Ingest & Config)", body_style),
            Paragraph("• Dual Drag-and-Drop Dropzones for Source & Reference images (GeoTIFF/PDS).<br/>• Metadata Card showing Sun Azimuth/Elevation, Sensor IDs, and Native GSD.<br/>• Configuration Drawer with controls for Grid Cells (e.g. 8x8), Reprojection Threshold (m), and Matcher Selection dropdown (Auto/LightGlue/CraterGraph/etc.).", body_style)
        ],
        [
            Paragraph("<b>2. RunView</b><br/>(Pipeline Execution)", body_style),
            Paragraph("• Real-time Progress Bar tracking Stages 0 through 8.<br/>• Active Matcher Gate Decision Badge (e.g. <font name='Courier'>Routed to: crater_graph</font>).<br/>• Live Terminal Execution Log window displaying stdout/stderr and stage timings.", body_style)
        ],
        [
            Paragraph("<b>3. CompareView</b><br/>(Interactive Inspection)", body_style),
            Paragraph("• <b>Split / Wipe Slider Canvas:</b> Vertical interactive curtain slider allowing smooth side-by-side inspection of Reference vs. Registered raster.<br/>• <b>8×8 Checkerboard Overlay Mode:</b> Toggleable square grid overlay to visually verify seam alignment.<br/>• <b>Match Point & Quiver Layer Toggle:</b> Interactive layer control to toggle GCP points and displacement vectors overlay.", body_style)
        ],
        [
            Paragraph("<b>4. Scoreboard</b><br/>(Metrics & Deliverables)", body_style),
            Paragraph("• <b>Metrics Cards:</b> Displays RMSE (px/m), Inlier Count & Ratio, CE90 Error Radius.<br/>• <b>Uniformity Scorecard:</b> Highlights Clark-Evans NNI Index (&gt;1.0) and Grid Coverage %.<br/>• <b>Deliverable Download Toolbar:</b> One-click downloads for <font name='Courier'>registered.tif</font>, <font name='Courier'>matches.csv</font>, and <font name='Courier'>registration_report.pdf</font>.", body_style)
        ],
    ]
    t_tabs = Table(tab_specs, colWidths=[130, 410])
    t_tabs.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BG_LIGHT),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    elements.append(t_tabs)
    elements.append(Spacer(1, 10))

    # ── Section 5: Verification & Execution Commands ───────────────────────
    elements.append(Paragraph("5. Verification & Execution Reference", h1_style))
    elements.append(Paragraph("To verify pipeline execution and gate routing locally, run the following commands:", body_style))

    code_block = [
        [Paragraph("<b>Task / Operation</b>", body_style), Paragraph("<b>Command Line Instruction</b>", body_style)],
        [
            Paragraph("Gate Routing Verification", body_style),
            Paragraph("<font name='Courier'>.venv/bin/python scripts/verify_gate_routing.py</font>", code_style)
        ],
        [
            Paragraph("Run Full Test Suite", body_style),
            Paragraph("<font name='Courier'>.venv/bin/pytest tests/ -q</font>", code_style)
        ],
        [
            Paragraph("Execute Single Pair CLI", body_style),
            Paragraph("<font name='Courier'>selene run --src &lt;source&gt; --ref &lt;reference&gt; --out products/job1</font>", code_style)
        ],
        [
            Paragraph("Launch API Server", body_style),
            Paragraph("<font name='Courier'>uvicorn api.main:app --reload --port 8000</font>", code_style)
        ],
        [
            Paragraph("Launch Workbench UI", body_style),
            Paragraph("<font name='Courier'>cd ui && npm run dev -- --port 5173</font>", code_style)
        ],
    ]
    t_code = Table(code_block, colWidths=[150, 390])
    t_code.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BG_LIGHT),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(t_code)

    # Build Document
    doc.build(elements, canvasmaker=NumberedCanvas)


if __name__ == "__main__":
    out_dir = Path("products")
    out_dir.mkdir(parents=True, exist_ok=True)
    pdf_file = out_dir / "isro_ps_and_uiux_specification.pdf"
    build_pdf(pdf_file)
    print(f"Generated PDF specification at: {pdf_file}")
