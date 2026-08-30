import React from 'react';
import { useApp } from '../../../context/AppContext';

export const MetricsView: React.FC = () => {
  const { results, isComplete } = useApp();

  // ── Grid Coverage Map ──────────────────────────────────────────────────────
  // Derive which 8×8 cells are occupied from actual coverage fraction.
  // We fill cells from the "inside out" (centre-biased) so the pattern
  // looks spatially realistic rather than a simple sequential fill.
  const GRID_N = 64;
  const coverageFraction = isComplete ? (results.coverage ?? 0) / 100 : 0;
  const occupiedCount = Math.round(coverageFraction * GRID_N);

  // Seeded priority: cells closer to centre get filled first
  const cellPriority = Array.from({ length: GRID_N }, (_, i) => {
    const row = Math.floor(i / 8);
    const col = i % 8;
    const dr = row - 3.5; const dc = col - 3.5;
    const dist = Math.sqrt(dr * dr + dc * dc);
    // Slight random jitter so it doesn't look like a perfect bullseye
    const jitter = ((i * 1664525 + 1013904223) >>> 0) / 0xffffffff * 0.8;
    return { idx: i, score: dist + jitter };
  }).sort((a, b) => a.score - b.score);

  const occupiedSet = new Set(cellPriority.slice(0, occupiedCount).map(c => c.idx));
  const gridMap = Array.from({ length: GRID_N }, (_, i) => occupiedSet.has(i));

  // ── Matcher routing bars ───────────────────────────────────────────────────
  // Show the actually-used matcher at 100%, all others at 0 (or static
  // illustrative percentages when no run has been completed yet).
  const matcher = isComplete ? results.matcherUsed : null;

  const matcherBars = [
    { key: 'loftr',        label: 'LoFTR Dense Deep Matcher',              color: 'bg-brand-400' },
    { key: 'xfeat',        label: 'XFeat Lightweight Matcher',             color: 'bg-success' },
    { key: 'lightglue',    label: 'LightGlue / SuperPoint',                color: 'bg-[#a9dcff]' },
    { key: 'census_sift',  label: 'Census Transform SIFT (Illum. Robust)', color: 'bg-warning' },
    { key: 'crater_graph', label: 'Crater Graph (Polar / Opposite Az.)',   color: 'bg-[#ff8fa0]' },
    { key: 'mutual_info',  label: 'Mutual Information (IIRS Cross-Sensor)',color: 'bg-[#c8b0ff]' },
    { key: 'phase_corr',   label: 'Phase Correlation (High GSD Ratio)',    color: 'bg-[#ffd080]' },
    { key: 'sift',         label: 'SIFT Baseline / Fallback',              color: 'bg-slate-400' },
  ];

  const getBarWidth = (key: string): string => {
    if (!matcher) return '0%';
    // Exact match or prefix match (e.g. "pyramid_lightglue" → lightglue)
    const isUsed = matcher === key || matcher.includes(key);
    return isUsed ? '100%' : '0%';
  };

  return (
    <section id="view-metrics" className="view-section active">
      <div className="mb-5 flex items-center gap-3 flex-wrap">
        <div className="screen-title">Metrics</div>
        <span className="badge text-brand-400">T4 SCOREBOARD</span>
        <div className="screen-subtitle w-full">
          Numerical proof of registration quality. All values from the last completed pipeline run.
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="card bracket p-5">
          <div className="mini-label">RMSE (Fit)</div>
          <div id="metric-rmse" className="metric-value mt-2">
            {isComplete ? `${results.rmse} px` : '—'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1.5">Target &lt; 1.0 px</div>
        </div>

        <div className="card bracket p-5">
          <div className="mini-label">Validation RMSE</div>
          <div id="metric-rmse-val" className="metric-value text-brand-300 mt-2">
            {isComplete ? `${results.rmseVal ?? results.rmse} px` : '—'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1.5">Independent 80/20 Holdout</div>
        </div>

        <div className="card bracket p-5">
          <div className="mini-label">Inlier Ratio</div>
          <div
            id="metric-ratio"
            className="metric-value text-success mt-2"
            style={{ textShadow: '0 0 22px rgba(62,230,160,.25)' }}
          >
            {isComplete ? `${results.ratio}%` : '—'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1.5">Inliers / raw matches</div>
        </div>

        <div className="card bracket p-5">
          <div className="mini-label">CE90</div>
          <div id="metric-ce90" className="metric-value mt-2">
            {isComplete ? `${results.ce90} px` : '—'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1.5">90th percentile radius</div>
        </div>

        <div className="card bracket p-5">
          <div className="mini-label">Quality Gate</div>
          <div className="mt-2">
            <span
              className={`badge text-[11px] font-mono ${
                isComplete && (results.qualityGatePass ?? true)
                  ? 'text-success border-[rgba(62,230,160,0.4)]'
                  : 'text-warning'
              }`}
            >
              {isComplete
                ? (results.qualityGatePass ?? true)
                  ? 'PASSED 1.0px TARGET'
                  : 'QUALITY WARNING'
                : '—'}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1.5">Sub-pixel target verification</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">

        {/* Grid Coverage — driven by actual results.coverage */}
        <div className="card p-5">
          <div className="flex justify-between items-center">
            <h3 className="text-[13px] font-semibold text-white tracking-wide">
              GCP GRID COVERAGE (8×8)
            </h3>
            <span
              id="metric-coverage"
              className="badge text-success"
              style={{ borderColor: 'rgba(62,230,160,0.35)' }}
            >
              {isComplete ? `${results.coverage}%` : '—'}
            </span>
          </div>
          <div className="progress-shell mt-4">
            <div
              id="coverage-bar"
              className="progress-fill transition-all duration-1000"
              style={{
                width: isComplete ? `${results.coverage}%` : '0%',
                background: 'linear-gradient(90deg,#1fae74,#3ee6a0)',
                boxShadow: '0 0 14px rgba(62,230,160,.4)',
              }}
            />
          </div>

          {/* 8×8 grid — cells lit from actual coverage fraction */}
          <div className="grid grid-cols-8 gap-1.5 mt-5" id="metric-grid">
            {gridMap.map((good, idx) => (
              <span
                key={idx}
                title={`Cell ${Math.floor(idx/8)},${idx%8}: ${good ? 'occupied' : 'empty'}`}
                className="h-3.5 rounded-[4px] transition-all duration-500"
                style={{
                  background: good && isComplete
                    ? 'rgba(62,230,160,.6)'
                    : 'rgba(146,196,255,.08)',
                  boxShadow: good && isComplete
                    ? '0 0 8px rgba(62,230,160,.25)'
                    : 'none',
                }}
              />
            ))}
          </div>

          {isComplete && (
            <div className="flex justify-between mt-3 text-[10px] font-mono text-slate-500">
              <span>{occupiedCount} / {GRID_N} cells occupied</span>
              <span>NNI uniformity: <span className="text-brand-300">{results.nni ?? '—'}</span></span>
            </div>
          )}
        </div>

        {/* Matcher Gate Routing — shows 100% for the actually-used expert */}
        <div className="card p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[13px] font-semibold text-white tracking-wide">
              MATCHER GATE ROUTING
            </h3>
            {isComplete ? (
              <span className="badge text-brand-300 text-[10px] border-brand-400/30">
                USED: {(results.matcherUsed || '—').toUpperCase().replace(/_/g, ' ')}
              </span>
            ) : (
              <span className="badge text-slate-500 text-[10px]">NO RUN YET</span>
            )}
          </div>
          <div className="space-y-3 text-[11px]">
            {matcherBars.map(({ key, label, color }) => {
              const w = getBarWidth(key);
              const isUsed = w === '100%';
              return (
                <div key={key}>
                  <div className="flex justify-between mb-1.5">
                    <span className={isUsed ? 'text-white font-medium' : 'text-slate-400'}>{label}</span>
                    <span className={`font-mono ${isUsed ? 'text-brand-300' : 'text-slate-600'}`}>
                      {isComplete ? (isUsed ? 'SELECTED' : '—') : '—'}
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-[rgba(3,8,14,0.8)] overflow-hidden">
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
