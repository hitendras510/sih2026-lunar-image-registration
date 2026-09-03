import React, { useState } from 'react';
import {
  Play,
  Database,
  Layers,
  Sliders,
  Cpu,
  Zap,
  Filter,
  Crosshair,
  Grid,
  Package,
  CheckCircle2,
  AlertCircle,
  Activity,
  ArrowRight,
  Terminal,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { MatcherType } from '../../../types';

interface StageDetail {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ElementType;
  description: string;
  kpis: { label: string; value: string; color?: string }[];
  accentColor: string;
  badgeBg: string;
}

const STAGE_DETAILS: StageDetail[] = [
  {
    id: '01',
    name: 'Ingest & Validation',
    subtitle: 'OK - SOURCE RASTER',
    icon: Database,
    description: 'Ingesting PDS3/PDS4 labels, sensor metadata (LRO NAC / C-2 OHRC), and 16-bit floating-point rasters.',
    accentColor: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    kpis: [
      { label: 'SOURCE FORMAT', value: 'GeoTIFF / PNG 16-bit' },
      { label: 'REFERENCE SENSOR', value: 'LRO NAC (0.50 m/px)' },
      { label: 'SUN ELEVATION', value: '34.5° vs 32.1°' },
      { label: 'RASTER DIMENSIONS', value: '1024 × 1024 px' },
    ],
  },
  {
    id: '02',
    name: 'GSD Resampling',
    subtitle: 'OK - PYRAMID SCALING',
    icon: Layers,
    description: 'Constructing multi-scale Gaussian pyramids & resampling both images to a uniform GSD grid.',
    accentColor: '#818cf8',
    badgeBg: 'rgba(129, 140, 248, 0.15)',
    kpis: [
      { label: 'SOURCE GSD', value: '0.25 m/px' },
      { label: 'REF GSD', value: '0.50 m/px' },
      { label: 'COMMON GSD TARGET', value: '0.50 m/px' },
      { label: 'PYRAMID LEVELS', value: '3 Scales (1×, 0.5×, 0.25×)' },
    ],
  },
  {
    id: '03',
    name: 'Equalization & Shadows',
    subtitle: 'OK - WALLIS FILTER',
    icon: Sliders,
    description: 'Phase congruency edge extraction & Wallis adaptive histogram equalization for high illumination invariance.',
    accentColor: '#f472b6',
    badgeBg: 'rgba(244, 114, 182, 0.15)',
    kpis: [
      { label: 'PHASE CONGRUENCY', value: 'Active (3 Scales, 6 Oris)' },
      { label: 'WALLIS WINDOW', value: '32 × 32 px' },
      { label: 'DYNAMIC RANGE', value: 'Normalized [0.0, 1.0]' },
      { label: 'SHADOW MASK', value: 'Thresholded < 0.05' },
    ],
  },
  {
    id: '04',
    name: 'Gate Router',
    subtitle: 'OK - EXPERT ROUTING',
    icon: Cpu,
    description: 'Evaluating orbital solar geometry & sensor modality matrix to select the optimal neural matcher expert.',
    accentColor: '#c084fc',
    badgeBg: 'rgba(192, 132, 252, 0.15)',
    kpis: [
      { label: 'Δ SUN AZIMUTH', value: '14.2° (Normal Light)' },
      { label: 'GSD RATIO', value: '1.00 (Matched)' },
      { label: 'SELECTED MATCHER', value: 'LoFTR / LightGlue', color: '#c084fc' },
      { label: 'EXPERT ROUTE CONF', value: '98.4%' },
    ],
  },
  {
    id: '05',
    name: 'Matcher Core',
    subtitle: 'CONVERGENCE PASS',
    icon: Zap,
    description: 'Extracting high-density candidate feature points & computing mutual neural correspondence vectors.',
    accentColor: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    kpis: [
      { label: 'RAW MATCHES', value: '21,389 Points', color: '#38bdf8' },
      { label: 'EXTRACTOR', value: 'SuperPoint / ALIKED' },
      { label: 'GPU MEMORY', value: '1.42 GB VRAM' },
      { label: 'EXTRACTION SPEED', value: '142 ms' },
    ],
  },
  {
    id: '06',
    name: 'MAGSAC++ Filtering',
    subtitle: 'OK - OUTLIER REMOVAL',
    icon: Filter,
    description: 'USAC_MAGSAC++ marginalizing sample consensus for robust spatial outlier elimination & matrix estimation.',
    accentColor: '#34d399',
    badgeBg: 'rgba(52, 211, 153, 0.15)',
    kpis: [
      { label: 'ROBUST INLIERS', value: '18,742 Points', color: '#34d399' },
      { label: 'INLIER RATIO', value: '87.6%', color: '#34d399' },
      { label: 'REJECTION RATE', value: '12.4% Outliers' },
      { label: 'CONVERGENCE ITERS', value: '100 / 100 Runs' },
    ],
  },
  {
    id: '07',
    name: 'IC-LK Refinement',
    subtitle: 'OK - SUB-PIXEL LOCK',
    icon: Crosshair,
    description: 'Inverse-Compositional Lucas-Kanade 21×21 sub-pixel refinement matrix solving H Δp = J^T ΔI.',
    accentColor: '#22d3ee',
    badgeBg: 'rgba(34, 211, 238, 0.15)',
    kpis: [
      { label: 'SUB-PIXEL RMSE', value: '0.062 px', color: '#22d3ee' },
      { label: 'PREVIOUS COARSE', value: '1.240 px' },
      { label: 'ERROR REDUCTION', value: '↓ 95.0% Drop', color: '#34d399' },
      { label: 'IC-LK ITERS', value: '14.2 / 30 iters' },
    ],
  },
  {
    id: '08',
    name: 'GCP Validation',
    subtitle: 'ERRORS: 0.68 px',
    icon: Grid,
    description: 'Evaluating uniform 8×8 grid coverage & 80/20 train/validation independent holdout ground control points.',
    accentColor: '#fbbf24',
    badgeBg: 'rgba(251, 191, 36, 0.15)',
    kpis: [
      { label: 'TRAIN RMSE', value: '0.68 px', color: '#fbbf24' },
      { label: 'VAL HOLDOUT RMSE', value: '0.72 px' },
      { label: 'COVERAGE INDEX', value: '81% Spatial Mesh' },
      { label: 'UNIFORMITY NNI', value: '0.84 (Well-Clustered)' },
    ],
  },
  {
    id: '09',
    name: 'Export Products',
    subtitle: 'DONE - 4 PRODUCTS',
    icon: Package,
    description: 'Warping source raster with Thin Plate Splines & generating registered GeoTIFF, CSV matches, and PDF report.',
    accentColor: '#4ade80',
    badgeBg: 'rgba(74, 222, 128, 0.15)',
    kpis: [
      { label: 'GEOTIFF OUTPUT', value: 'registered.tif (16.4 MB)', color: '#4ade80' },
      { label: 'TELEMETRY CSV', value: 'matches.csv (2.1 MB)' },
      { label: 'PDF REPORT', value: 'Selene_Report.pdf' },
      { label: 'QUALITY GATE', value: '✓ PASSED (< 1.0 px)', color: '#4ade80' },
    ],
  },
];

export const RegisterView: React.FC = () => {
  const {
    selectedMatcher,
    setSelectedMatcher,
    geometryModel,
    setGeometryModel,
    runRegistration,
    isProcessing,
    pipelineProgress,
    activeStepIndex,
    logs,
  } = useApp();

  const [stepStage, setStepStage] = useState('0 - 0');
  const [pairInstance, setPairInstance] = useState('2');
  const [logMode, setLogMode] = useState<'stream' | 'store'>('stream');
  const [selectedStageOverride, setSelectedStageOverride] = useState<number | null>(null);

  // Compute active stage index (defaults to activeStepIndex if processing, or last step if completed)
  const currentStageIndex = selectedStageOverride !== null
    ? selectedStageOverride
    : activeStepIndex >= 0
    ? activeStepIndex
    : 0;

  const currentStage = STAGE_DETAILS[currentStageIndex] || STAGE_DETAILS[0];
  const StageIcon = currentStage.icon;
  const terminalRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <section id="view-register" className="view-section active space-y-6 font-sans pb-10">
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Pipeline Registration Setup
          </h1>
          <div className="text-xs text-slate-400 font-mono tracking-wide mt-1">
            Configure matching algorithm hyperparameters, geometric transformation models, and outlier filtering thresholds.
          </div>
        </div>

        {/* TOP COMPACT STATUS */}
        <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 font-mono text-xs">
          <span className="text-slate-400">Status:</span>
          <span className={`font-semibold ${isProcessing ? 'text-amber-400' : pipelineProgress === 100 ? 'text-emerald-400' : 'text-slate-400'}`}>
            {isProcessing ? 'Executing Pipeline...' : pipelineProgress === 100 ? 'Pipeline Complete' : 'Ready'}
          </span>
        </div>
      </div>

      {/* PARAMETER CONFIGURATION CARD */}
      <div className="p-6 sm:p-8 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
          {/* STEP / STAGE */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Pipeline Stage
            </label>
            <select
              value={stepStage}
              onChange={(e) => setStepStage(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:border-sky-400 focus:outline-none"
            >
              <option value="0 - 0">0 - 0 (Full Automatic 9-Stage)</option>
              <option value="0 - 4">0 - 4 (Initial Match Only)</option>
              <option value="0 - 8">0 - 8 (Full Registration Pipeline)</option>
            </select>
          </div>

          {/* PAIR INSTANCE */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Pair Instance
            </label>
            <select
              value={pairInstance}
              onChange={(e) => setPairInstance(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:border-sky-400 focus:outline-none"
            >
              <option value="2">Pair #2 (OHRC 0.25 m / LRO NAC 0.50 m)</option>
              <option value="1">Pair #1 (TMC-2 5.0 m / WAC 100 m)</option>
              <option value="3">Pair #3 (IIRS Hyperspectral / TMC-2)</option>
            </select>
          </div>

          {/* PIPELINE MATCHER */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Matcher Model
            </label>
            <select
              value={selectedMatcher}
              onChange={(e) => setSelectedMatcher(e.target.value as MatcherType)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 text-sky-400 font-mono text-xs focus:border-sky-400 focus:outline-none font-semibold"
            >
              <option value="auto">Auto – Intelligent Gate Routing</option>
              <option value="loftr">LoFTR Dense Deep Matcher</option>
              <option value="xfeat">XFeat Lightweight Matcher</option>
              <option value="lightglue">LightGlue (ALIKED/SuperPoint)</option>
              <option value="crater_graph">Crater Graph (Polarity Invariant)</option>
              <option value="phase_corr">Phase Correlation (FFT Translation)</option>
              <option value="mutual_info">Mutual Information (Cross-Sensor)</option>
              <option value="sift">SIFT Baseline</option>
            </select>
          </div>

          {/* OUTPUT GEOMETRY */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Geodetic Model
            </label>
            <select
              value={geometryModel}
              onChange={(e) => setGeometryModel(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:border-sky-400 focus:outline-none"
            >
              <option value="DEM + Map Projection (Tier 2)">DEM – Map Projection</option>
              <option value="ISIS/SPICE (Tier 1)">ISIS/SPICE Camera Model</option>
              <option value="Selenographic Sphere (Tier 3)">Selenographic Ellipsoid</option>
            </select>
          </div>
        </div>

        {/* ACTIVE MATCHER BITS & RUN REGISTRATION BUTTON */}
        <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-800 flex-wrap gap-4 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Selected Matcher:</span>
            <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-3 py-1 rounded border border-sky-500/20 uppercase">
              {selectedMatcher === 'auto' ? 'Auto Routing' : selectedMatcher}
            </span>
          </div>

          <button
            onClick={() => {
              setSelectedStageOverride(null);
              runRegistration();
            }}
            disabled={isProcessing}
            className="px-6 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white transition-all disabled:opacity-50 shadow-lg shadow-sky-500/20"
          >
            <Play className={`w-4 h-4 text-white fill-white ${isProcessing ? 'animate-spin' : ''}`} />
            {isProcessing ? 'Executing Pipeline...' : 'Run Registration Pipeline'}
          </button>
        </div>
      </div>

      {/* ── INTERACTIVE DYNAMIC PIPELINE STAGE CARDS GRID ───────────────────── */}
      <div className="p-6 sm:p-8 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" />
              Pipeline Execution Stages (9 Stages)
            </h3>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              Click any stage card to inspect live telemetry and algorithmic parameters.
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-slate-400">
              Stage <span className="text-white font-bold">{currentStageIndex + 1}</span> / 9
            </span>
            <div className="font-mono text-xs font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded border border-sky-500/20">
              {pipelineProgress}%
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800 mb-6">
          <div
            className="h-full bg-sky-500 transition-all duration-300"
            style={{ width: `${pipelineProgress}%` }}
          />
        </div>

        {/* 9 Stage Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-9 gap-3">
          {STAGE_DETAILS.map((stg, idx) => {
            const IconComp = stg.icon;
            const isRunning = isProcessing && activeStepIndex === idx;
            const isDone = activeStepIndex > idx || (pipelineProgress === 100 && activeStepIndex >= idx);
            const isSelected = currentStageIndex === idx;

            let borderStyle = 'border-slate-800/80 bg-[#050b14]';
            if (isRunning) {
              borderStyle = 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_20px_rgba(56,189,248,0.35)] animate-pulse';
            } else if (isDone) {
              borderStyle = 'border-emerald-500/40 bg-[#06151f]';
            } else if (isSelected) {
              borderStyle = 'border-cyan-500/60 bg-[#081729]';
            }

            return (
              <button
                key={stg.id}
                onClick={() => setSelectedStageOverride(idx)}
                className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between h-28 relative group overflow-hidden ${borderStyle}`}
              >
                {/* Glow bar indicator */}
                <div
                  className="absolute top-0 left-0 right-0 h-1 transition-all"
                  style={{
                    background: isRunning ? '#38bdf8' : isDone ? '#34d399' : isSelected ? '#a855f7' : 'transparent',
                  }}
                />

                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-cyan-400">
                    {stg.id}
                  </span>
                  <div className="p-1 rounded-md bg-slate-900/90 border border-slate-800 text-slate-300 group-hover:scale-110 transition-transform">
                    <IconComp className="w-3.5 h-3.5" style={{ color: isRunning ? '#38bdf8' : isDone ? '#34d399' : stg.accentColor }} />
                  </div>
                </div>

                <div>
                  <div className="font-display text-[12px] font-bold text-white tracking-wide truncate">
                    {stg.name}
                  </div>
                  <div className="font-mono text-[8.5px] mt-1 font-semibold tracking-wider flex items-center gap-1" style={{ color: isDone ? '#34d399' : isRunning ? '#38bdf8' : '#94a3b8' }}>
                    {isRunning ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                        RUNNING
                      </>
                    ) : isDone ? (
                      <>
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                        PASSED
                      </>
                    ) : (
                      'STANDBY'
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── ACTIVE PIPELINE STAGE TELEMETRY & ALGORITHMIC HUD ──────────────── */}
      <div className="card p-6 sm:p-7 rounded-xl bg-[#040912] border border-cyan-500/30 backdrop-blur-md shadow-2xl relative overflow-hidden font-mono">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
              <StageIcon className="w-5 h-5" style={{ color: currentStage.accentColor }} />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[14px] text-white font-bold font-display">
                STAGE {currentStage.id}: {currentStage.name.toUpperCase()}
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono border" style={{ background: currentStage.badgeBg, borderColor: currentStage.accentColor, color: currentStage.accentColor }}>
                  {currentStage.subtitle}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                {currentStage.description}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-slate-400">TELEMETRY MODE:</span>
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-cyan-300 font-bold">
              REAL-TIME GPU MONITOR
            </span>
          </div>
        </div>

        {/* KPI Telemetry Grid for Active Stage */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
          {currentStage.kpis.map((k, i) => (
            <div key={i} className="bg-[#02060e] p-3.5 rounded-lg border border-slate-800/90 flex flex-col justify-between">
              <span className="text-slate-400 text-[10px] uppercase tracking-wider">{k.label}</span>
              <span className="text-[14px] font-bold mt-1 text-white truncate" style={{ color: k.color || '#e2e8f0' }}>
                {k.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* LIVE EXECUTION LOG CARD */}
      <div className="card p-6 sm:p-7 rounded-xl bg-slate-950/70 border border-[rgba(146,196,255,0.18)] backdrop-blur-md shadow-2xl">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-[14px] font-bold font-display text-white tracking-wide flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            LIVE EXECUTION TERMINAL LOG
          </h3>
          <div className="flex items-center gap-2.5 font-mono text-[10px]">
            <button
              onClick={() => setLogMode('stream')}
              className={`px-3.5 py-1.5 rounded-md border tracking-[0.14em] font-semibold uppercase transition-all cursor-pointer ${
                logMode === 'stream'
                  ? 'border-cyan-400/50 text-cyan-300 bg-cyan-950/50 shadow-[0_0_12px_rgba(111,246,255,0.2)]'
                  : 'border-slate-800 text-slate-400 hover:border-slate-700 bg-slate-900/40'
              }`}
            >
              STREAM
            </button>
            <button
              onClick={() => setLogMode('store')}
              className={`px-3.5 py-1.5 rounded-md border tracking-[0.14em] font-semibold uppercase transition-all cursor-pointer ${
                logMode === 'store'
                  ? 'border-cyan-400/50 text-cyan-300 bg-cyan-950/50 shadow-[0_0_12px_rgba(111,246,255,0.2)]'
                  : 'border-slate-800 text-slate-400 hover:border-slate-700 bg-slate-900/40'
              }`}
            >
              STORE
            </button>
          </div>
        </div>

        <div className="term rounded-xl border border-[rgba(146,196,255,0.18)] bg-[#030810] overflow-hidden shadow-inner">
          <div className="term-head px-4.5 py-3 bg-[#050d17] border-b border-[rgba(146,196,255,0.12)] flex items-center justify-between">
            <div className="flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff6b7a] inline-block mr-1.5" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffb65c] inline-block mr-1.5" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#3ee6a0] inline-block mr-2.5" />
              <span className="font-mono text-[9.5px] font-semibold text-slate-400 tracking-[0.24em] uppercase">
                PIPELINE STDOUT / STDERR STREAM
              </span>
            </div>
            <span className="font-mono text-[9px] text-cyan-400">SELENE-ENGINE v2.0</span>
          </div>

          <div
            ref={terminalRef}
            className="h-64 overflow-y-auto p-4.5 space-y-2 font-mono text-[11.5px] leading-relaxed overscroll-contain"
          >
            {logs.length === 0 ? (
              <div className="text-slate-500 font-mono text-[11.5px]">
                <span className="text-[#54738c] mr-2.5">[19:52:07]</span>
                <span className="text-[#e3f2fd]">SELENE-MATCH Workbench initialized. Ready for pipeline execution.</span>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="term-line flex items-start gap-2.5">
                  <span className="text-[#54738c] font-mono shrink-0">
                    [{log.timestamp}]
                  </span>
                  <span
                    className={
                      log.type === 'error'
                        ? 'text-red-400 font-mono font-semibold'
                        : log.type === 'success'
                        ? 'text-emerald-400 font-mono font-semibold'
                        : 'text-[#e3f2fd] font-mono'
                    }
                  >
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
