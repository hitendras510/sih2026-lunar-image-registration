"""Generate a formatted PDF cheatsheet of all SELENE-MATCH commands."""
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from datetime import datetime
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "selene_commands_reference.pdf"

# ── Colour palette (light / white theme) ─────────────────────────────────────
DARK_BG   = colors.white
BLUE      = colors.HexColor("#1A56DB")
GREEN     = colors.HexColor("#166534")
ORANGE    = colors.HexColor("#B45309")
PURPLE    = colors.HexColor("#6D28D9")
CYAN      = colors.HexColor("#0369A1")
RED       = colors.HexColor("#B91C1C")
GRAY      = colors.HexColor("#4B5563")
CODE_BG   = colors.HexColor("#F3F4F6")
SECTION_BG= colors.HexColor("#EFF6FF")
WHITE     = colors.HexColor("#111827")

# ── Styles ────────────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

title_style = ParagraphStyle("title", fontName="Helvetica-Bold", fontSize=22,
    textColor=WHITE, alignment=TA_CENTER, spaceAfter=4)
subtitle_style = ParagraphStyle("subtitle", fontName="Helvetica", fontSize=11,
    textColor=GRAY, alignment=TA_CENTER, spaceAfter=16)
section_style = ParagraphStyle("section", fontName="Helvetica-Bold", fontSize=13,
    textColor=BLUE, spaceBefore=14, spaceAfter=6)
desc_style = ParagraphStyle("desc", fontName="Helvetica", fontSize=9,
    textColor=GRAY, spaceAfter=4, leading=13)
note_style = ParagraphStyle("note", fontName="Helvetica-Oblique", fontSize=8,
    textColor=ORANGE, spaceAfter=2)
code_style = ParagraphStyle("code", fontName="Courier", fontSize=8,
    textColor=GREEN, backColor=CODE_BG, leftIndent=6, rightIndent=6,
    spaceAfter=2, leading=13, borderPadding=(4,6,4,6))
label_style = ParagraphStyle("label", fontName="Helvetica-Bold", fontSize=8,
    textColor=CYAN, spaceAfter=1)

# Row alternating colors for tables (light theme)
ROW_A = colors.white
ROW_B = colors.HexColor("#F9FAFB")

def section(title, icon=""):
    return [
        Spacer(1, 0.15*cm),
        HRFlowable(width="100%", thickness=1, color=BLUE, spaceAfter=4),
        Paragraph(f"{icon}  {title}" if icon else title, section_style),
    ]

def cmd(label, command, note=None):
    items = [Paragraph(label, label_style), Paragraph(command, code_style)]
    if note:
        items.append(Paragraph(f"↳ {note}", note_style))
    items.append(Spacer(1, 0.1*cm))
    return items

def desc(text):
    return [Paragraph(text, desc_style)]

# ── Content ───────────────────────────────────────────────────────────────────
story = []

# Header
story += [
    Spacer(1, 0.3*cm),
    Paragraph("SELENE-MATCH", title_style),
    Paragraph("Lunar Image Registration — Command Reference", subtitle_style),
    Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}  |  Project: sih2026-lunar-image-registration", subtitle_style),
    HRFlowable(width="100%", thickness=2, color=BLUE),
    Spacer(1, 0.2*cm),
]

# ── 1. Environment Setup ───────────────────────────────────────────────────────
story += section("1. Environment Setup", "⚙")
story += desc("Run once to create the conda environment and install all dependencies.")
story += cmd("Create conda environment", "conda env create -f environment.yml")
story += cmd("Activate environment", "conda activate selene")
story += cmd("Install package in editable mode (dev)", ".venv/bin/pip install -e .")
story += cmd("Verify installation", ".venv/bin/python -c \"import selene; print('selene OK')\"")

# ── 2. Synthetic Data Generation ──────────────────────────────────────────────
story += section("2. Synthetic Data Generation", "🌕")
story += desc("Generate reference + synthetic target images with metadata sidecars. "
              "Default produces a 180° sun-azimuth flip to exercise crater_graph routing.")
story += cmd(
    "Generate pair from real OHRC image (full OHRC file)",
    ".venv/bin/python data_generation/generate_synthetic_pair.py \\\n"
    "  --image \"/home/hitendra/Documents/data/chandryan-2_ohrc/"
    "ch2_ohr_ncp_20210331T2033243734_b_brw_d18.png\" \\\n"
    "  --output_dir data_generation/output",
    "Writes reference.png, synthetic_target.png, ground_truth.json, reference.json, synthetic_target.json"
)
story += cmd(
    "Generate pair from cropped OHRC image",
    ".venv/bin/python data_generation/generate_synthetic_pair.py \\\n"
    "  --image \"/home/hitendra/Documents/data/chandryan-2_ohrc/cropped.png\" \\\n"
    "  --output_dir data_generation/output",
)
story += cmd(
    "Generate procedural lunar surface (no input image)",
    ".venv/bin/python data_generation/generate_synthetic_pair.py \\\n"
    "  --output_dir data_generation/output",
    "Falls back to fractal crater terrain generator"
)
story += cmd(
    "Custom sun angles (same illumination test — routes to lightglue)",
    ".venv/bin/python data_generation/generate_synthetic_pair.py \\\n"
    "  --image \"/path/to/ohrc.png\" \\\n"
    "  --sun_az_ref 45.0 --sun_az_tgt 50.0 --output_dir data_generation/output",
    "Δaz=5° → lightglue expert"
)
story += cmd(
    "Custom sun angles (cross-scale test — routes to phase_corr)",
    ".venv/bin/python data_generation/generate_synthetic_pair.py \\\n"
    "  --sun_az_ref 40.0 --sun_az_tgt 42.0 \\\n"
    "  --gsd_m 5.0 --sensor_id TMC2 --output_dir data_generation/output",
)

# ── 3. Full Pipeline ───────────────────────────────────────────────────────────
story += section("3. Full Registration Pipeline  (selene run)", "🚀")
story += desc("Runs all 8 stages: Ingest → GSD Pyramid → Shadow Mask → Gate → MAGSAC++ → GCP Sampling → LK Refinement → Warp → Metrics.")
story += cmd(
    "Run pipeline on synthetic pair",
    ".venv/bin/selene run \\\n"
    "  --src data_generation/output/synthetic_target.png \\\n"
    "  --ref data_generation/output/reference.png \\\n"
    "  --out results/",
    "Check log for: Δaz, gsd_ratio, Matcher used, RMSE"
)
story += cmd(
    "Run with custom config file",
    ".venv/bin/selene run \\\n"
    "  --src data_generation/output/synthetic_target.png \\\n"
    "  --ref data_generation/output/reference.png \\\n"
    "  --out results/ --config config.yaml",
)
story += cmd(
    "View saved metrics after run",
    "cat results/metrics.json",
    "Check: nni_index and grid_coverage_fraction are non-null"
)
story += cmd("List all output deliverables", "ls -lh results/")

# ── 4. Tests ───────────────────────────────────────────────────────────────────
story += section("4. Unit & Integration Tests", "🧪")
story += desc("All tests live in tests/. 11 tests total covering metrics, geometry, ingest, gate, LK, pyramid, polarity.")
story += cmd("Run all tests (quiet)", ".venv/bin/pytest tests/ -q")
story += cmd("Run all tests (verbose)", ".venv/bin/pytest tests/ -v")
story += cmd("Run single test file", ".venv/bin/pytest tests/test_matchers_gate.py -v")
story += cmd("Run with coverage report", ".venv/bin/pytest tests/ --cov=selene --cov-report=term-missing")
story += cmd("Stop on first failure", ".venv/bin/pytest tests/ -x")

test_files = [
    ("test_eval_metrics.py",      "RMSE, CE90, NNI, grid_coverage computation"),
    ("test_geometry_synthetic.py","Affine transform recovery on synthetic pairs"),
    ("test_ingest.py",            "Pair.from_paths, metadata sidecar loading"),
    ("test_matchers_gate.py",     "Gate routing: 4 experts, 4 scenarios"),
    ("test_polarity_flip.py",     "Phase congruency + shadow-illumination flip"),
    ("test_pyramid.py",           "resample_to_gsd, upscale_coordinates"),
    ("test_subpixel_lk.py",       "IC-LK sub-pixel refinement convergence"),
]
table_data = [["Test File", "Covers"]] + [[Paragraph(f, code_style), Paragraph(c, desc_style)] for f, c in test_files]
tbl = Table(table_data, colWidths=[6.5*cm, 10*cm])
tbl.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), SECTION_BG),
    ("TEXTCOLOR",  (0,0), (-1,0), CYAN),
    ("FONTNAME",   (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTSIZE",   (0,0), (-1,0), 8),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [ROW_A, ROW_B]),
    ("GRID", (0,0), (-1,-1), 0.3, GRAY),
    ("TOPPADDING",  (0,0), (-1,-1), 4),
    ("BOTTOMPADDING",(0,0), (-1,-1), 4),
    ("LEFTPADDING", (0,0), (-1,-1), 6),
]))
story += [tbl, Spacer(1, 0.2*cm)]

# ── 5. Gate Routing Verification ──────────────────────────────────────────────
story += section("5. Gate Routing Regression Verification", "🔀")
story += desc("Confirms that different metadata inputs produce different expert selections. "
              "All 4 experts must be exercised — if only lightglue fires, metadata wiring is broken.")
story += cmd(
    "Run gate routing verification script",
    ".venv/bin/python scripts/verify_gate_routing.py",
    "Expected: lightglue / crater_graph / mutual_info / phase_corr — all 4 different"
)

routing_data = [
    ["Scenario", "Δaz", "GSD Ratio", "Expected Expert"],
    ["Similar illumination (OHRC ↔ NAC)", "10°", "2×", "lightglue"],
    ["Opposite sun / polarity flip",      "180°", "1×", "crater_graph"],
    ["Cross-sensor IIRS ↔ WAC",           "10°",  "1.25×", "mutual_info"],
    ["High scale ratio TMC2 ↔ NAC",       "2°",   "10×", "phase_corr"],
]
rt = Table(routing_data, colWidths=[6.5*cm, 1.8*cm, 2.2*cm, 6*cm])
rt.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), SECTION_BG),
    ("TEXTCOLOR",  (0,0), (-1,0), CYAN),
    ("FONTNAME",   (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTSIZE",   (0,0), (-1,-1), 8),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [ROW_A, ROW_B]),
    ("GRID", (0,0), (-1,-1), 0.3, GRAY),
    ("TOPPADDING",  (0,0), (-1,-1), 4),
    ("BOTTOMPADDING",(0,0), (-1,-1), 4),
    ("LEFTPADDING", (0,0), (-1,-1), 6),
    ("TEXTCOLOR", (3,1), (3,1), GREEN),
    ("TEXTCOLOR", (3,2), (3,2), RED),
    ("TEXTCOLOR", (3,3), (3,3), ORANGE),
    ("TEXTCOLOR", (3,4), (3,4), PURPLE),
]))
story += [rt, Spacer(1, 0.2*cm)]

# ── 6. Backend API ─────────────────────────────────────────────────────────────
story += section("6. Backend API  (FastAPI)", "🖥")
story += desc("REST API on port 8000. Swagger docs auto-generated at /docs.")
story += cmd("Start API server", ".venv/bin/uvicorn api.main:app --reload --port 8000",
             "Visit: http://localhost:8000/docs")
story += cmd("Health check", "curl http://localhost:8000/health")
story += cmd("Submit a registration job via API",
    "curl -X POST http://localhost:8000/register \\\n"
    "  -F \"src=@data_generation/output/synthetic_target.png\" \\\n"
    "  -F \"ref=@data_generation/output/reference.png\"")
story += cmd("Make API target (Makefile shortcut)", "make api")

# ── 7. Frontend UI ─────────────────────────────────────────────────────────────
story += section("7. Frontend UI  (Vite / React)", "🌐")
story += desc("Dev server on port 5173. Requires Node.js.")
story += cmd("Install dependencies + start dev server", "cd ui && npm install && npm run dev -- --port 5173",
             "Visit: http://localhost:5173")
story += cmd("Make ui target (Makefile shortcut)", "make ui")
story += cmd("Build production bundle", "cd ui && npm run build")

# ── 8. Evaluation & Export ────────────────────────────────────────────────────
story += section("8. Evaluation & Export", "📊")
story += cmd("Print metrics for a completed job", ".venv/bin/selene eval --job results/")
story += cmd("Export deliverables as zip",
    ".venv/bin/selene export --job results/ --zip selene_deliverable.zip")
story += cmd("View checkerboard plot", "eog results/plot_checkerboard.png")
story += cmd("View quiver (displacement) plot", "eog results/plot_quiver.png")
story += cmd("View GCP coverage heatmap", "eog results/plot_coverage.png")
story += cmd("Open PDF report", "xdg-open results/report.pdf")

# ── 9. Specification PDF ──────────────────────────────────────────────────────
story += section("9. Generate Specification PDF", "📄")
story += cmd("Generate project specification PDF",
    ".venv/bin/python scripts/generate_specification_pdf.py",
    "Outputs full technical specification document")
story += cmd("Generate this commands reference PDF",
    ".venv/bin/python scripts/generate_commands_pdf.py",
    "Outputs: selene_commands_reference.pdf")

# ── 10. Expected Output Checklist ─────────────────────────────────────────────
story += section("10. Expected Output Verification Checklist", "✅")
checks = [
    ("metadata log",       "Stage 1 log shows ref_meta az=45.0°, mov_meta az=225.0°  (NOT 90.0°)"),
    ("Δaz",                "Stage 1 log shows Δaz=180.0°  (NOT 0.0°)"),
    ("Expert routing",     "Matcher [crater_graph] — NOT always lightglue"),
    ("metrics.json",       "Contains nni_index and grid_coverage_fraction with non-null values"),
    ("All tests pass",     "pytest reports  11 passed"),
    ("Gate verification",  "verify_gate_routing.py prints 4 different expert names"),
]
ck = Table(
    [["Check", "Expected Value"]] + [[Paragraph(c, label_style), Paragraph(v, desc_style)] for c, v in checks],
    colWidths=[4.5*cm, 12*cm]
)
ck.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), SECTION_BG),
    ("TEXTCOLOR",  (0,0), (-1,0), CYAN),
    ("FONTNAME",   (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTSIZE",   (0,0), (-1,0), 8),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [ROW_A, ROW_B]),
    ("GRID", (0,0), (-1,-1), 0.3, GRAY),
    ("TOPPADDING",  (0,0), (-1,-1), 4),
    ("BOTTOMPADDING",(0,0), (-1,-1), 4),
    ("LEFTPADDING", (0,0), (-1,-1), 6),
]))
story += [ck, Spacer(1, 0.3*cm)]

# ── Footer ────────────────────────────────────────────────────────────────────
story += [
    HRFlowable(width="100%", thickness=1, color=GRAY),
    Paragraph("SELENE-MATCH  |  SIH 2026  |  Lunar Image Registration System", subtitle_style),
]

# ── Build PDF ─────────────────────────────────────────────────────────────────
doc = SimpleDocTemplate(
    str(OUT),
    pagesize=A4,
    leftMargin=1.8*cm, rightMargin=1.8*cm,
    topMargin=1.5*cm, bottomMargin=1.5*cm,
    title="SELENE-MATCH Command Reference",
    author="SIH 2026 Team",
)

def white_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(colors.white)
    canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
    # Thin blue top bar for branding
    canvas.setFillColor(BLUE)
    canvas.rect(0, A4[1] - 0.4*cm, A4[0], 0.4*cm, fill=1, stroke=0)
    # Page number
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(GRAY)
    canvas.drawRightString(A4[0] - 1.8*cm, 0.8*cm, f"Page {doc.page}")
    canvas.restoreState()

doc.build(story, onFirstPage=white_page, onLaterPages=white_page)
print(f"[SUCCESS] PDF saved to: {OUT}")
