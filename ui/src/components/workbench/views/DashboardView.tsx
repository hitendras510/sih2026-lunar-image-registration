import React from 'react';
import { useApp } from '../../../context/AppContext';

export const DashboardView: React.FC = () => {
  const { navigateTo, isProcessing, isComplete, results } = useApp();

  return (
    <section id="view-dashboard" className="view-section active">
      <div className="mb-6 flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="screen-title">SELENE-MATCH Workbench</div>
          <div className="screen-subtitle">
            A single workspace for multi-modal lunar image registration. Each screen owns its dedicated functionality.
          </div>
        </div>
        <span className="badge">
          <span className="led" style={{ display: 'inline-block', marginRight: '6px' }} />
          All Systems Nominal
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-5">
        <div className="card bracket p-4">
          <div className="mini-label">Input</div>
          <div className="text-white font-medium mt-2.5 text-[13px]">
            OHRC / TMC-2 / IIRS
          </div>
          <p className="text-[11px] text-slate-500 mt-1">vs LRO NAC / WAC</p>
        </div>

        <div className="card bracket p-4">
          <div className="mini-label">Scale Range</div>
          <div
            className="text-[26px] text-brand-300 font-medium mt-1 tracking-tight"
            style={{ textShadow: '0 0 22px rgba(111,246,255,.3)' }}
          >
            320×
          </div>
          <p className="text-[11px] text-slate-500">GSD disparity handled</p>
        </div>

        <div className="card bracket p-4">
          <div className="mini-label">Accuracy Target</div>
          <div
            className="text-[26px] text-success font-medium mt-1 tracking-tight"
            style={{ textShadow: '0 0 22px rgba(62,230,160,.3)' }}
          >
            &lt; 1 px
          </div>
          <p className="text-[11px] text-slate-500">Sub-pixel refinement</p>
        </div>

        <div className="card bracket p-4">
          <div className="mini-label">Pipeline</div>
          <div
            id="dash-status"
            className="text-[26px] text-slate-200 font-medium mt-1 tracking-tight"
          >
            {isProcessing ? 'Running' : isComplete ? 'Complete' : 'Idle'}
          </div>
          <p id="dash-method" className="text-[11px] text-slate-500">
            {isProcessing
              ? 'Processing S0-S8...'
              : isComplete
              ? results.method
              : 'Awaiting image pair'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-[13px] font-semibold text-white mb-4 tracking-wide">
            HOW SELENE-MATCH WORKS
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="panel p-3.5 relative overflow-hidden group hover:border-[rgba(111,246,255,0.35)] transition-colors">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="font-mono text-[10px] text-brand-400">01</div>
              <div className="text-white text-xs mt-2 font-medium">Ingest</div>
              <div className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                Read image + metadata
              </div>
            </div>
            <div className="panel p-3.5 relative overflow-hidden group hover:border-[rgba(111,246,255,0.35)] transition-colors">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="font-mono text-[10px] text-brand-400">02</div>
              <div className="text-white text-xs mt-2 font-medium">Equalize</div>
              <div className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                Common GSD pyramid
              </div>
            </div>
            <div className="panel p-3.5 relative overflow-hidden group hover:border-[rgba(111,246,255,0.35)] transition-colors">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="font-mono text-[10px] text-brand-400">03</div>
              <div className="text-white text-xs mt-2 font-medium">Match</div>
              <div className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                Gate selects expert
              </div>
            </div>
            <div className="panel p-3.5 relative overflow-hidden group hover:border-[rgba(111,246,255,0.35)] transition-colors">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="font-mono text-[10px] text-brand-400">04</div>
              <div className="text-white text-xs mt-2 font-medium">Register</div>
              <div className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                MAGSAC++ + IC-LK
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5 mt-5">
            <button
              className="btn-primary px-5 py-2.5 rounded-lg text-[11px] tracking-wider"
              onClick={() => navigateTo('upload')}
            >
              START WITH UPLOAD ↗
            </button>
            <button
              className="btn-secondary px-5 py-2.5 rounded-lg text-[11px] tracking-wider"
              onClick={() => navigateTo('register')}
            >
              OPEN REGISTRATION
            </button>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-[13px] font-semibold text-white mb-4 tracking-wide">
            CHALLENGE → SOLUTION
          </h3>
          <div className="space-y-3.5 text-[11px]">
            <div className="flex gap-3">
              <span className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full bg-warning shadow-[0_0_8px_rgba(255,182,92,0.8)]" />
              <div>
                <span className="text-warning font-mono text-[9px] tracking-[0.14em]">
                  ILLUMINATION
                </span>
                <p className="text-slate-500 mt-1 leading-relaxed">
                  Phase congruency, shadow masks, relighting, crater graph.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full bg-warning shadow-[0_0_8px_rgba(255,182,92,0.8)]" />
              <div>
                <span className="text-warning font-mono text-[9px] tracking-[0.14em]">
                  SCALE
                </span>
                <p className="text-slate-500 mt-1 leading-relaxed">
                  Common metres-per-pixel GSD pyramid.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full bg-warning shadow-[0_0_8px_rgba(255,182,92,0.8)]" />
              <div>
                <span className="text-warning font-mono text-[9px] tracking-[0.14em]">
                  VIEWPOINT
                </span>
                <p className="text-slate-500 mt-1 leading-relaxed">
                  Robust affine/homography + TPS/piecewise geometry.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full bg-warning shadow-[0_0_8px_rgba(255,182,92,0.8)]" />
              <div>
                <span className="text-warning font-mono text-[9px] tracking-[0.14em]">
                  PRECISION
                </span>
                <p className="text-slate-500 mt-1 leading-relaxed">
                  Native-resolution IC-LK sub-pixel refinement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
