import React from 'react';
import {
  CheckCircle,
  Layers,
  Maximize2,
  Target,
  Clock,
  UploadCloud,
  Share2,
  CheckCircle2,
  Sun,
  Scale,
  Compass,
  KeyRound,
  Upload,
  ExternalLink,
  SlidersHorizontal,
  ArrowRight,
  Zap,
  Shield,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';

const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  sub: string;
  icon: React.ElementType;
  color: 'sky' | 'emerald' | 'amber' | 'slate';
}> = ({ label, value, sub, icon: Icon, color }) => {
  const colorMap = {
    sky:     { bg: 'bg-sky-500/10',     border: 'border-sky-500/20',     text: 'text-sky-400' },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
    amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   text: 'text-amber-400' },
    slate:   { bg: 'bg-slate-500/10',   border: 'border-slate-500/20',   text: 'text-slate-400' },
  };
  const c = colorMap[color];

  return (
    <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm flex items-start justify-between gap-4">
      <div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
          {label}
        </span>
        <div className="text-xl font-bold text-white mt-1">
          {value}
        </div>
        <p className="text-xs text-slate-500 mt-1 font-mono">{sub}</p>
      </div>

      <div className={`p-2.5 rounded-lg ${c.bg} border ${c.border} ${c.text} shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
};

const StepCard: React.FC<{
  n: string;
  title: string;
  desc: string;
  icon: React.ElementType;
  last?: boolean;
}> = ({ n, title, desc, icon: Icon, last }) => (
  <div className="relative flex flex-col items-center text-center group">
    <div className="relative z-10 p-3.5 rounded-2xl bg-gradient-to-b from-[rgba(57,168,255,0.12)] to-[rgba(57,168,255,0.04)] border border-blue-400/20 text-blue-400 mb-3 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(57,168,255,0.25)] group-hover:border-blue-400/40">
      <Icon className="w-5 h-5" />
    </div>
    {!last && (
      <div className="hidden sm:block absolute top-6 left-[calc(50%+28px)] right-0 h-[1px]">
        <div className="w-full h-full bg-gradient-to-r from-[rgba(111,246,255,0.3)] to-transparent relative overflow-hidden">
          <div className="absolute inset-y-[-1px] w-6 bg-cyan-400/80 rounded-full animate-[flowx_2s_linear_infinite]" />
        </div>
      </div>
    )}
    <span className="font-mono text-[10px] font-bold text-cyan-400/60 tracking-[0.18em] mb-1">{n}</span>
    <div className="text-white text-[13px] font-bold font-display tracking-wide">{title}</div>
    <div className="text-[10.5px] text-slate-500 font-mono mt-1 leading-relaxed">{desc}</div>
  </div>
);

const ChallengeRow: React.FC<{ icon: React.ElementType; label: string; desc: string }> = ({ icon: Icon, label, desc }) => (
  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[rgba(6,12,22,0.5)] border border-[rgba(146,196,255,0.07)] hover:border-amber-500/20 hover:bg-amber-500/4 transition-all duration-200">
    <div className="p-2 rounded-lg bg-amber-500/8 border border-amber-500/20 text-amber-400 shrink-0">
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <div className="text-amber-400 font-mono text-[9.5px] font-bold tracking-[0.18em] uppercase">{label}</div>
      <p className="text-slate-500 font-mono text-[10.5px] mt-1 leading-relaxed">{desc}</p>
    </div>
  </div>
);

export const DashboardView: React.FC = () => {
  const { navigateTo, isProcessing, isComplete, results } = useApp();

  return (
    <section id="view-dashboard" className="view-section active space-y-5">

      {/* ── PAGE HEADER ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="font-mono text-[9px] text-cyan-500/70 tracking-[0.24em] uppercase mb-1.5 flex items-center gap-2">
            <span className="w-4 h-[1px] bg-cyan-500/50" />
            SIH 2026 · PROBLEM ID 26166
          </div>
          <h1 className="text-[22px] font-bold font-display text-white tracking-tight leading-none">
            SELENE-MATCH
            <span className="text-[13px] font-mono text-slate-500 ml-2 tracking-wider">Workbench</span>
          </h1>
          <p className="text-[11px] text-slate-500 font-mono tracking-wide mt-1.5 max-w-xl">
            Multi-modal, sun-angle & scale invariant image registration for Chandrayaan-2 optical imagery.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.14em] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-3 py-1.5 rounded-full shadow-[0_0_12px_rgba(62,230,160,0.08)]">
            <CheckCircle className="w-3 h-3" />
            ALL SYSTEMS NOMINAL
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.14em] text-cyan-400 bg-cyan-950/30 border border-cyan-500/15 px-3 py-1.5 rounded-full">
            <Zap className="w-3 h-3" />
            OHRC · TMC-2 · IIRS
          </span>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Input Sensors"
          value="OHRC / TMC-2 / IIRS"
          sub="vs LRO NAC Reference"
          icon={Layers}
          color="sky"
        />
        <StatCard
          label="Scale Range"
          value="320× Mismatch"
          sub="GSD disparity handled"
          icon={Maximize2}
          color="sky"
        />
        <StatCard
          label="Target Accuracy"
          value="< 0.5 px RMSE"
          sub="Sub-pixel refinement"
          icon={Target}
          color="emerald"
        />
        <StatCard
          label="Pipeline Status"
          value={isProcessing ? 'Processing...' : isComplete ? 'Registered' : 'Ready'}
          sub={isProcessing ? 'Executing alignment' : isComplete ? results.method : 'Awaiting image pair'}
          icon={Clock}
          color={isProcessing ? 'amber' : isComplete ? 'emerald' : 'slate'}
        />
      </div>

      {/* ── MAIN PANELS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* HOW IT WORKS — 3/5 */}
        <div className="lg:col-span-3 rounded-2xl border border-[rgba(146,196,255,0.1)] bg-gradient-to-b from-[rgba(12,24,40,0.65)] to-[rgba(6,13,22,0.75)] backdrop-blur-md overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-[rgba(146,196,255,0.08)]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[12px] font-bold font-display text-white tracking-[0.1em] uppercase">
                  How SELENE-MATCH Works
                </h3>
                <p className="font-mono text-[9.5px] text-slate-500 mt-0.5">
                  4-stage registration pipeline with gate-routed expert matchers
                </p>
              </div>
              <Shield className="w-5 h-5 text-cyan-500/40" />
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative">
              <StepCard n="01" title="Ingest"    desc="Read image + metadata sidecar"  icon={UploadCloud}       />
              <StepCard n="02" title="Equalize"  desc="Common GSD pyramid resampling"  icon={SlidersHorizontal} />
              <StepCard n="03" title="Match"     desc="Gate selects expert matcher"     icon={Share2}            />
              <StepCard n="04" title="Register"  desc="MAGSAC++ + IC-LK sub-pixel"     icon={CheckCircle2} last />
            </div>
          </div>

          <div className="px-6 pb-5 flex flex-wrap gap-3 border-t border-[rgba(146,196,255,0.07)] pt-4">
            <button
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11.5px] font-bold font-display tracking-[0.12em] bg-gradient-to-r from-[#1d64ec] to-[#00b4d8] text-white hover:opacity-90 hover:scale-[1.02] transition-all cursor-pointer shadow-[0_0_20px_rgba(29,100,236,0.30)] uppercase border border-cyan-400/30"
              onClick={() => navigateTo('upload')}
            >
              <Upload className="w-3.5 h-3.5" />
              Start with Upload
            </button>
            <button
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11.5px] font-bold font-display tracking-[0.12em] border border-[rgba(146,196,255,0.18)] text-slate-300 hover:text-white hover:border-cyan-400/40 hover:bg-cyan-500/8 transition-all cursor-pointer uppercase"
              onClick={() => navigateTo('register')}
            >
              Open Registration
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CHALLENGE → SOLUTION — 2/5 */}
        <div className="lg:col-span-2 rounded-2xl border border-[rgba(146,196,255,0.1)] bg-gradient-to-b from-[rgba(12,24,40,0.65)] to-[rgba(6,13,22,0.75)] backdrop-blur-md overflow-hidden">
          <div className="px-5 pt-5 pb-4 border-b border-[rgba(146,196,255,0.08)] flex items-center justify-between">
            <div>
              <h3 className="text-[12px] font-bold font-display text-white tracking-[0.1em] uppercase">
                Challenge → Solution
              </h3>
              <p className="font-mono text-[9.5px] text-slate-500 mt-0.5">Per SIH 2026 PS-26166</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600" />
          </div>

          <div className="p-4 space-y-2.5">
            <ChallengeRow icon={Sun}      label="ILLUMINATION" desc="Phase congruency, shadow masks, relighting, crater graph." />
            <ChallengeRow icon={Scale}    label="SCALE"        desc="Common m/px GSD pyramid; 320× disparity handled." />
            <ChallengeRow icon={Compass}  label="VIEWPOINT"    desc="Robust affine/homography + TPS piecewise geometry." />
            <ChallengeRow icon={KeyRound} label="SUB-PIXEL"    desc="Native-resolution IC-LK sub-pixel refinement." />
          </div>
        </div>
      </div>

      {/* ── QUICK METRICS (only when complete) ── */}
      {isComplete && (
        <div className="rounded-2xl border border-[rgba(62,230,160,0.15)] bg-gradient-to-r from-[rgba(6,24,16,0.5)] to-[rgba(4,14,10,0.5)] backdrop-blur-md px-6 py-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(62,230,160,0.9)]" />
            <span className="font-mono text-[9px] text-emerald-500 tracking-[0.2em] uppercase font-bold">
              Latest Registration Results
            </span>
            <span className="ml-2 font-mono text-[9px] text-slate-500">— via {results.method}</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[
              { label: 'RMSE',      value: `${results.rmse} px`,  color: 'text-cyan-300' },
              { label: 'RAW MATCHES', value: results.raw?.toLocaleString() ?? '—', color: 'text-white' },
              { label: 'INLIERS',   value: results.inliers?.toLocaleString() ?? '—', color: 'text-emerald-300' },
              { label: 'RATIO',     value: `${results.ratio}%`,   color: 'text-emerald-300' },
              { label: 'CE90',      value: `${results.ce90} px`,  color: 'text-white' },
              { label: 'TIME',      value: `${results.time}s`,    color: 'text-amber-300' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <div className={`font-display font-bold text-[17px] ${color} tabular-nums`}>{value}</div>
                <div className="font-mono text-[8.5px] text-slate-600 mt-0.5 tracking-wider">{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

    </section>
  );
};
