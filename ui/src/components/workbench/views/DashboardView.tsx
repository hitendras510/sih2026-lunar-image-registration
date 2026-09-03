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
      <div className="flex items-center justify-between flex-wrap gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            ISRO Lunar Registration Portal Dashboard
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Department of Space · Chandrayaan-2 Optical Data Processing Suite · SIH Problem #26166
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-3 py-1 rounded bg-slate-900 border border-slate-800 text-emerald-400 font-semibold flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            System Operational
          </span>
          <span className="px-3 py-1 rounded bg-slate-900 border border-slate-800 text-sky-400 font-semibold">
            OHRC / TMC-2 / IIRS
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
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* HOW IT WORKS — 3/5 */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Registration Workflow
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  4-step automated processing pipeline
                </p>
              </div>
              <Shield className="w-5 h-5 text-sky-400" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <StepCard n="01" title="Ingest"    desc="Read image & metadata"          icon={UploadCloud}       />
              <StepCard n="02" title="Equalize"  desc="Multi-scale GSD pyramid"        icon={SlidersHorizontal} />
              <StepCard n="03" title="Match"     desc="Adaptive feature matcher"       icon={Share2}            />
              <StepCard n="04" title="Register"  desc="Sub-pixel alignment"            icon={CheckCircle2} last />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 border-t border-slate-800 pt-5 mt-6">
            <button
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white transition-all shadow-md shadow-sky-500/20"
              onClick={() => navigateTo('upload')}
            >
              <Upload className="w-4 h-4" />
              Upload Image Pair
            </button>
            <button
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold border border-slate-800 bg-slate-950 text-slate-300 hover:text-white hover:border-slate-700 transition-all"
              onClick={() => navigateTo('register')}
            >
              Configure Pipeline
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CHALLENGE → SOLUTION — 2/5 */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-6">
          <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Core Capabilities
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">SIH Problem #26166</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500" />
          </div>

          <div className="space-y-3 mt-4">
            <ChallengeRow icon={Sun}      label="Illumination" desc="Phase congruency & shadow invariant feature extraction." />
            <ChallengeRow icon={Scale}    label="Scale Disparity" desc="GSD pyramid handles up to 320× resolution mismatch." />
            <ChallengeRow icon={Compass}  label="Geometry Model"  desc="Homography & Thin Plate Spline piecewise warping." />
            <ChallengeRow icon={KeyRound} label="Sub-Pixel RMSE" desc="Lucas-Kanade optical flow refines matched control points." />
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
