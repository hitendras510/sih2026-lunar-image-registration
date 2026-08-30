import React from 'react';
import { useApp } from '../../../context/AppContext';

export const LogsView: React.FC = () => {
  const { logs, clearLogs } = useApp();

  return (
    <section id="view-logs" className="view-section active">
      <div className="mb-5">
        <div className="screen-title">System Logs</div>
        <div className="screen-subtitle">Pipeline stdout/stderr and user actions.</div>
      </div>
      <div className="card p-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[13px] font-semibold text-white tracking-wide">
            EXECUTION LOG
          </h3>
          <button
            onClick={clearLogs}
            className="btn-secondary px-4 py-1.5 rounded-lg text-[10px] tracking-[0.1em] font-mono"
          >
            CLEAR
          </button>
        </div>
        <div className="term">
          <div className="term-head">
            <span className="td bg-[#ff6b7a]" />
            <span className="td bg-[#ffb65c]" />
            <span className="td bg-[#3ee6a0]" />
            <span className="font-mono text-[8.5px] text-slate-600 ml-2 tracking-[0.18em]">
              SYSTEM.LOG
            </span>
          </div>
          <div className="min-h-[460px] max-h-[600px] p-4 overflow-y-auto space-y-1">
            {logs.map((l) => (
              <div key={l.id} className={`term-line ${l.type}`}>
                <span className="ts">[{l.timestamp}]</span>
                <span>{l.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
