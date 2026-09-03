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
  const meta = viewMeta[currentView] ?? { title: 'Workbench', sub: 'SELENE' };

  return (
    <header className="h-[60px] shrink-0 flex items-center justify-between px-6 bg-[#1F4E79] text-white border-b border-[#163A5C]">
      {/* LEFT: Home navigation + Title Block */}
      <div className="flex items-center gap-4 min-w-0">
        <button
          onClick={(e) => { e.preventDefault(); goHome(); }}
          className="p-1.5 rounded bg-[#163A5C] text-white hover:bg-[#122e49] transition-colors flex items-center justify-center shrink-0 border border-white/20"
          title="Back to Landing Page"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h2 id="header-title" className="text-white font-bold text-base tracking-tight truncate">
              {meta.title}
            </h2>
            {isProcessing && (
              <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-[#FFF3E0] text-[#B26A00] border border-[#B26A00]/30">
                Processing
              </span>
            )}
            {isComplete && !isProcessing && (
              <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/30">
                Registration Complete
              </span>
            )}
          </div>
          <p id="header-subtitle" className="text-xs text-blue-100 truncate">
            {meta.sub}
          </p>
        </div>
      </div>

      {/* RIGHT: Metric summary badge */}
      <div className="flex items-center gap-3 shrink-0 text-xs">
        {isComplete && (
          <div className="px-3 py-1 rounded bg-[#163A5C] border border-white/20 text-white font-mono text-xs">
            RMSE: <strong className="text-emerald-300">{results.rmse} px</strong>
          </div>
        )}
      </div>
    </header>
  );
};
