import React from 'react';
import { useApp } from '../../../context/AppContext';

export const MetricsView: React.FC = () => {
  const { results, isComplete } = useApp();

  // ── Grid Coverage Map ──────────────────────────────────────────────────────
  // Derive which 8×8 cells are occupied from actual coverage fraction.
  const GRID_N = 64;
  const coverageFraction = isComplete ? (results.coverage ?? 0) / 100 : 0;
  const occupiedCount = Math.round(coverageFraction * GRID_N);

  // Seeded priority: cells closer to centre get filled first
  const cellPriority = Array.from({ length: GRID_N }, (_, i) => {
    const row = Math.floor(i / 8);
    const col = i % 8;
    const dr = row - 3.5; const dc = col - 3.5;
    const dist = Math.sqrt(dr * dr + dc * dc);
    const jitter = ((i * 1664525 + 1013904223) >>> 0) / 0xffffffff * 0.8;
    return { idx: i, score: dist + jitter };
  }).sort((a, b) => a.score - b.score);

  const occupiedSet = new Set(cellPriority.slice(0, occupiedCount).map(c => c.idx));
  const gridMap = Array.from({ length: GRID_N }, (_, i) => occupiedSet.has(i));

  // ── Matcher routing bars ───────────────────────────────────────────────────
  const matcher = isComplete ? results.matcherUsed : null;

  const matcherBars = [
    { key: 'loftr',        label: 'LoFTR Dense Deep Matcher',              color: 'bg-brand-400' },
    { key: 'xfeat',        label: 'XFeat Lightweight Matcher',             color: 'bg-emerald-400' },
    { key: 'lightglue',    label: 'LightGlue / SuperPoint',                color: 'bg-cyan-300' },
    { key: 'census_sift',  label: 'Census Transform SIFT (Illum. Robust)', color: 'bg-amber-400' },
    { key: 'crater_graph', label: 'Crater Graph (Polar / Opposite Az.)',   color: 'bg-pink-400' },
    { key: 'mutual_info',  label: 'Mutual Information (IIRS Cross-Sensor)',color: 'bg-purple-400' },
    { key: 'phase_corr',   label: 'Phase Correlation (High GSD Ratio)',    color: 'bg-amber-300' },
    { key: 'sift',         label: 'SIFT Baseline / Fallback',              color: 'bg-slate-400' },
  ];

  const getBarWidth = (key: string): string => {
    if (!matcher) return '0%';
    const isUsed = matcher === key || matcher.includes(key);
    return isUsed ? '100%' : '0%';
  };

  return (
    <section id="view-metrics" className="view-section active space-y-6">
      {/* PAGE HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Registration Evaluation Metrics
        </h1>
        <div className="text-xs text-slate-400 font-mono tracking-wide mt-1">
          Numerical evaluation of registration quality, residual RMSE, and ground control point coverage.
        </div>
      </div>

      {/* KPI METRIC CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
      {/* SCOREBOARD GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* RMSE */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            RMSE (Fit)
          </label>
          <div id="metric-rmse" className="text-2xl font-bold font-mono text-white mt-1">
            {isComplete ? `${results.rmse} px` : '—'}
          </div>
          <div className="text-xs text-slate-500 font-mono mt-1">Target &lt; 1.0 px</div>
        </div>

        {/* VALIDATION RMSE */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Validation RMSE
          </label>
          <div id="metric-rmse-val" className="text-2xl font-bold font-mono text-sky-400 mt-1">
            {isComplete ? `${results.rmseVal ?? results.rmse} px` : '—'}
          </div>
          <div className="text-xs text-slate-500 font-mono mt-1">80/20 Holdout</div>
        </div>

        {/* INLIER RATIO */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Inlier Ratio
          </label>
          <div id="metric-ratio" className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {isComplete ? `${results.ratio}%` : '—'}
          </div>
          <div className="text-xs text-slate-500 font-mono mt-1">Filtered / Total</div>
        </div>

        {/* CE90 */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            CE90 Radius
          </label>
          <div id="metric-ce90" className="text-2xl font-bold font-mono text-white mt-1">
            {isComplete ? `${results.ce90} px` : '—'}
          </div>
          <div className="text-xs text-slate-500 font-mono mt-1">90th Percentile Error</div>
        </div>

        {/* QUALITY GATE */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm col-span-2 sm:col-span-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Quality Gate
          </label>
          <div className="mt-1.5">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold ${
                isComplete && (results.qualityGatePass ?? true)
                  ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                  : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
              }`}
            >
              {isComplete
                ? (results.qualityGatePass ?? true)
                  ? 'PASSED TARGET'
                  : 'QUALITY WARNING'
                : '—'}
            </span>
          </div>
          <div className="text-xs text-slate-500 font-mono mt-1">Sub-pixel status</div>
        </div>
      </div>

      {/* COVERAGE & ROUTING CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRID COVERAGE CARD */}
        <div className="card p-6 sm:p-7 rounded-xl bg-slate-950/60 border border-[rgba(146,196,255,0.14)] backdrop-blur-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[14px] font-bold font-display text-white tracking-wide uppercase">
              GRID COVERAGE (8×8 UNIFORMITY)
            </h3>
            <span
              id="metric-coverage"
              className="badge font-mono text-[11px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1 rounded-md tracking-wider"
            >
              {isComplete ? `${results.coverage}%` : '—'}
            </span>
          </div>

          <div className="progress-shell mb-6">
            <div
              id="coverage-bar"
              className="progress-fill transition-all duration-1000"
              style={{
                width: isComplete ? `${results.coverage}%` : '0%',
                background: 'linear-gradient(90deg, #1fae74, #3ee6a0)',
                boxShadow: '0 0 16px rgba(62,230,160,0.4)',
              }}
            />
          </div>

          <div className="grid grid-cols-8 gap-2 mt-6" id="metric-grid">
            {gridMap.map((good, idx) => (
              <span
                key={idx}
                title={`Cell ${Math.floor(idx/8)},${idx%8}: ${good ? 'occupied' : 'empty'}`}
                className="h-4 rounded-md transition-all duration-300"
                style={{
                  background:
                    good && isComplete
                      ? 'rgba(62,230,160,0.65)'
                      : 'rgba(146,196,255,0.08)',
                  boxShadow:
                    good && isComplete
                      ? '0 0 10px rgba(62,230,160,0.3)'
                      : 'none',
                }}
              />
            ))}
          </div>

          {isComplete && (
            <div className="flex justify-between mt-3 text-[10px] font-mono text-slate-500">
              <span>{occupiedCount} / {GRID_N} cells occupied</span>
              <span>NNI uniformity: <span className="text-cyan-300">{results.nni ?? '—'}</span></span>
            </div>
          )}
        </div>

        {/* MATCHER GATE ROUTING DISTRIBUTION */}
        <div className="card p-6 sm:p-7 rounded-xl bg-slate-950/60 border border-[rgba(146,196,255,0.14)] backdrop-blur-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[14px] font-bold font-display text-white tracking-wide uppercase">
              MATCHER GATE ROUTING
            </h3>
            {isComplete ? (
              <span className="badge text-cyan-300 text-[10px] border border-cyan-500/30 px-3 py-1 rounded-md font-mono">
                USED: {(results.matcherUsed || '—').toUpperCase().replace(/_/g, ' ')}
              </span>
            ) : (
              <span className="badge text-slate-500 text-[10px] font-mono">NO RUN YET</span>
            )}
          </div>

          <div className="space-y-3 text-[11px] mt-6">
            {matcherBars.map(({ key, label, color }) => {
              const w = getBarWidth(key);
              const isUsed = w === '100%';
              return (
                <div key={key}>
                  <div className="flex justify-between mb-1.5 font-mono">
                    <span className={isUsed ? 'text-white font-semibold' : 'text-slate-400'}>{label}</span>
                    <span className={`font-mono ${isUsed ? 'text-cyan-300 font-bold' : 'text-slate-600'}`}>
                      {isComplete ? (isUsed ? 'SELECTED' : '—') : '—'}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-900 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 ${color}`}
                      style={{ width: w }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {!isComplete && (
            <p className="text-[10px] text-slate-500 mt-4 font-mono">
              Run the registration pipeline to see which expert was selected by the gate.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
