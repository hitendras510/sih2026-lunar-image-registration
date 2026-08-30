import React from 'react';
import { Play } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { MatcherType, PipelineStageInfo } from '../../../types';

const pipelineStages: PipelineStageInfo[] = [
  { id: 'S0', name: 'Ingest', sub: 'PDS / GEOTIFF' },
  { id: 'S1', name: 'GSD', sub: 'EQUALIZE SCALE' },
  { id: 'S2', name: 'Illumination', sub: 'CLAHE / MASKS' },
  { id: 'S3', name: 'Gate', sub: 'SELECT EXPERT' },
  { id: 'S4', name: 'Match', sub: 'CORRESPONDENCES' },
  { id: 'S5', name: 'MAGSAC++', sub: 'REJECT OUTLIERS' },
  { id: 'S6', name: 'IC-LK', sub: 'SUB-PIXEL' },
  { id: 'S7', name: 'GCP', sub: 'UNIFORM 8×8' },
  { id: 'S8', name: 'Export', sub: 'PRODUCTS + METRICS' },
];

export const RegisterView: React.FC = () => {
  const {
    gridCells,
    setGridCells,
    reprojThreshold,
    setReprojThreshold,
    selectedMatcher,
    setSelectedMatcher,
    geometryModel,
    setGeometryModel,
    routedMatcher,
    runRegistration,
    isProcessing,
    pipelineProgress,
    activeStepIndex,
    logs,
  } = useApp();

  return (
    <section id="view-register" className="view-section active">
      <div className="mb-5 flex items-center gap-3 flex-wrap">
        <div className="screen-title">Register Images</div>
        <span className="badge text-brand-400">T2 RUNVIEW</span>
        <div className="screen-subtitle w-full">
          Configure the pair, watch Stages 0–8, see the matcher decision and run the registration pipeline.
        </div>
      </div>

      {/* PARAMETER CONFIGURATION */}
      <div className="card bracket p-5 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="mini-label mb-2">Grid Cells</label>
            <select
              value={gridCells}
              onChange={(e) => setGridCells(e.target.value)}
              className="w-full p-2.5"
            >
              <option value="8 × 8">8 × 8</option>
              <option value="6 × 6">6 × 6</option>
              <option value="10 × 10">10 × 10</option>
            </select>
          </div>
          <div>
            <label className="mini-label mb-2">Reprojection Threshold</label>
            <input
              type="number"
              value={reprojThreshold}
              onChange={(e) => setReprojThreshold(parseFloat(e.target.value) || 2)}
              className="w-full p-2.5"
            />
            <div className="font-mono text-[8.5px] text-slate-600 mt-1.5 tracking-[0.1em]">
              METRES
            </div>
          </div>
          <div>
            <label className="mini-label mb-2">Matcher Selection</label>
            <select
              value={selectedMatcher}
              onChange={(e) => setSelectedMatcher(e.target.value as MatcherType)}
              className="w-full p-2.5"
            >
              <option value="auto">Auto — Gate Routing</option>
              <option value="loftr">LoFTR Dense Deep Matcher</option>
              <option value="xfeat">XFeat Lightweight Matcher</option>
              <option value="lightglue">LightGlue</option>
              <option value="crater_graph">Crater Graph</option>
              <option value="phase_corr">Phase Correlation</option>
              <option value="mutual_info">Mutual Information</option>
              <option value="sift">SIFT Baseline</option>
            </select>
          </div>
          <div>
            <label className="mini-label mb-2">Geometry</label>
            <select
              value={geometryModel}
              onChange={(e) => setGeometryModel(e.target.value)}
              className="w-full p-2.5"
            >
              <option value="DEM + Map Projection (Tier 2)">
                DEM + Map Projection (Tier 2)
              </option>
              <option value="ISIS/SPICE (Tier 1)">ISIS/SPICE (Tier 1)</option>
              <option value="Selenographic Sphere (Tier 3)">
                Selenographic Sphere (Tier 3)
              </option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between mt-5 pt-4 border-t border-[rgba(146,196,255,0.1)] flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="mini-label" style={{ justifyContent: 'flex-start' }}>
              Active Matcher Gate
            </span>
            <span
              className={`badge ${
                routedMatcher.includes('ROUTED')
                  ? 'text-brand-300'
                  : 'text-warning'
              }`}
              style={{
                borderColor: routedMatcher.includes('ROUTED')
                  ? 'rgba(111,246,255,0.4)'
                  : 'rgba(255,182,92,0.3)',
              }}
            >
              {routedMatcher}
            </span>
          </div>

          <button
            onClick={runRegistration}
            disabled={isProcessing}
            className="btn-primary px-6 py-3 rounded-lg text-[11px] font-bold flex items-center gap-2 tracking-[0.08em] disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            {isProcessing ? 'PROCESSING...' : 'RUN REGISTRATION'}
          </button>
        </div>
      </div>

      {/* PIPELINE PROGRESS */}
      <div className="card p-5 mb-5">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-[13px] font-semibold text-white tracking-wide">
            PIPELINE PROGRESS{' '}
            <span className="font-mono text-[9px] text-slate-600 ml-2 tracking-[0.14em]">
              S0 → S8
            </span>
          </h3>
          <span className="font-mono text-[10px] text-brand-300">
            {pipelineProgress}%
          </span>
        </div>
        <div className="progress-shell">
          <div
            className="progress-fill"
            style={{ width: `${pipelineProgress}%` }}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-9 gap-2 mt-4">
          {pipelineStages.map((p, idx) => {
            let stageClass = 'stage';
            if (activeStepIndex === idx && isProcessing) {
              stageClass += ' running';
            } else if (activeStepIndex > idx || (pipelineProgress === 100 && activeStepIndex >= idx)) {
              stageClass += ' done';
            }

            return (
              <div key={p.id} className={stageClass}>
                <div className="stage-top">
                  <span className="stage-id">{p.id}</span>
                  <span className="stage-ic">✓</span>
                </div>
                <div className="stage-name">{p.name}</div>
                <div className="stage-sub">{p.sub}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TERMINAL EXECUTION LOG */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-semibold text-white tracking-wide">
            LIVE EXECUTION LOG
          </h3>
          <span className="badge">STDOUT / STDERR</span>
        </div>
        <div className="term">
          <div className="term-head">
            <span className="td bg-[#ff6b7a]" />
            <span className="td bg-[#ffb65c]" />
            <span className="td bg-[#3ee6a0]" />
            <span className="font-mono text-[8.5px] text-slate-600 ml-2 tracking-[0.18em]">
              PIPELINE.OUT
            </span>
          </div>
          <div className="h-52 overflow-y-auto p-3 space-y-1">
            {logs.map((log) => (
              <div key={log.id} className={`term-line ${log.type}`}>
                <span className="ts">[{log.timestamp}]</span>
                <span>{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
