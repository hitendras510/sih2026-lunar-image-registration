import React, { useState, useEffect } from 'react';
import { ArrowLeft, Satellite, Radio, Cpu, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WorkbenchView } from '../../types';

const viewMeta: Record<WorkbenchView, { title: string; sub: string }> = {
  dashboard: { title: 'Dashboard Overview',    sub: 'SELENE Multi-Modal Lunar Registration Workbench' },
  upload:    { title: 'Image Pair Ingestion',   sub: 'Upload and inspect Reference & Target lunar image pairs' },
  register:  { title: 'Pipeline Alignment',    sub: 'Configure registration algorithms & homography parameters' },
  results:   { title: 'Visual Comparison',     sub: 'Interactive side-by-side & overlay curtain inspector' },
  matches:   { title: 'Feature Correspondences', sub: 'Inspect inlier keypoint correspondences and vectors' },
  metrics:   { title: 'Evaluation Metrics',    sub: 'RMSE, SSIM, PSNR, NMI & error distribution analytics' },
  exports:   { title: 'Geospatial Exports',    sub: 'Export GeoTIFF, PNG, GCP matrix, and PDF reports' },
  logs:      { title: 'System Telemetry Logs', sub: 'Real-time execution log feed & event history' },
  settings:  { title: 'Workbench Settings',     sub: 'System preferences & API backend endpoint setup' },
  about:     { title: 'About Project',         sub: 'ISRO Smart India Hackathon Lunar Registration Suite' },
};

export const Header: React.FC = () => {
  const { currentView, goHome, isProcessing, isComplete, results } = useApp();
  const [utcTime, setUtcTime] = useState<string>('00:00:00');

  useEffect(() => {
    const tick = () => setUtcTime(new Date().toISOString().slice(11, 19));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const meta = viewMeta[currentView] ?? { title: 'Workbench', sub: 'SELENE' };

  return (
    <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
      {/* LEFT: Home navigation + Title Block */}
      <div className="flex items-center gap-4 min-w-0">
        <button
          onClick={(e) => { e.preventDefault(); goHome(); }}
          className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-800 transition-all flex items-center justify-center shrink-0"
          title="Back to Landing Page"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 id="header-title" className="text-white font-bold text-base tracking-tight truncate">
                {meta.title}
              </h2>
              {isProcessing && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Processing
                </span>
              )}
              {isComplete && !isProcessing && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Registered
                </span>
              )}
            </div>
            <p id="header-subtitle" className="text-xs text-slate-400 truncate">
              {meta.sub}
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT: Clock & System Telemetry */}
      <div className="flex items-center gap-3 shrink-0">
        {isComplete && (
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-xs font-medium text-emerald-400">
            <Cpu className="w-3.5 h-3.5" />
            <span>RMSE: <strong>{results.rmse} px</strong></span>
          </div>
        )}

        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg border border-slate-800 bg-slate-950 text-xs font-mono text-slate-400">
          <Satellite className="w-3.5 h-3.5 text-slate-500" />
          <span>UTC</span>
          <span id="utc-clock" className="text-slate-200 font-semibold">{utcTime}</span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-xs font-medium text-emerald-400">
          <Radio className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Online</span>
        </div>
      </div>
    </header>
  );
};
