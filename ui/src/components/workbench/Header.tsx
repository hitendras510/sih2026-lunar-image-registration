import React, { useState, useEffect } from 'react';
import { ArrowLeft, Satellite } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WorkbenchView } from '../../types';

const viewTitles: Record<WorkbenchView, [string, string]> = {
  dashboard: ['Dashboard', 'SELENE-MATCH • MULTI-MODAL LUNAR REGISTRATION'],
  upload: ['Image Upload', 'T1 PAIRDESK • INGEST & CONFIGURE'],
  register: ['Register Images', 'T2 RUNVIEW • PIPELINE EXECUTION'],
  results: ['Results', 'T3 COMPAREVIEW • INTERACTIVE INSPECTION'],
  matches: ['Matches', 'CORRESPONDENCE INSPECTION'],
  metrics: ['Metrics', 'T4 SCOREBOARD • METRICS & DELIVERABLES'],
  exports: ['Exports', 'REGISTERED PRODUCTS AND REPORTS'],
  logs: ['System Logs', 'PIPELINE EXECUTION HISTORY'],
  settings: ['Settings', 'WORKBENCH CONFIGURATION'],
  about: ['About SELENE-MATCH', 'PROJECT OVERVIEW'],
};

export const Header: React.FC = () => {
  const { currentView, goHome } = useApp();
  const [utcTime, setUtcTime] = useState<string>('UTC 00:00:00');

  useEffect(() => {
    const interval = setInterval(() => {
      setUtcTime(`UTC ${new Date().toISOString().slice(11, 19)}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const [title, subtitle] = viewTitles[currentView] || [
    'Workbench',
    'SELENE-MATCH',
  ];

  return (
    <header className="app-header h-14 shrink-0 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            goHome();
          }}
          className="text-slate-600 hover:text-brand-400 transition-colors"
          title="Back to home"
        >
          <ArrowLeft className="w-4 h-4" />
        </a>
        <div>
          <h2 id="header-title" className="text-white font-semibold text-[15px]">
            {title}
          </h2>
          <p
            id="header-subtitle"
            className="font-mono text-[9px] text-slate-500 tracking-[0.14em] mt-0.5"
          >
            {subtitle}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="clock-chip hidden md:flex">
          <Satellite className="w-3 h-3" />
          <span id="utc-clock">{utcTime}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-slate-600">System</span>
          <span className="flex items-center gap-1.5 text-success font-mono text-[9.5px] tracking-[0.14em]">
            <span className="led" />
            ONLINE
          </span>
        </div>
      </div>
    </header>
  );
};
