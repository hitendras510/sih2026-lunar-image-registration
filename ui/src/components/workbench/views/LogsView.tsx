import React from 'react';
import { Trash2 } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export const LogsView: React.FC = () => {
  const { logs, clearLogs } = useApp();
  const logsContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <section id="view-logs" className="view-section active space-y-6">
      {/* PAGE HEADER */}
      <div className="pb-3 border-b border-[#D0D0D0]">
        <h1 className="text-xl font-bold text-[#222222]">
          Execution Log Console
        </h1>
        <p className="text-xs text-[#555555] mt-0.5">
          Real-time pipeline execution log stream and event history.
        </p>
      </div>

      {/* TERMINAL LOG CARD */}
      <div className="p-5 rounded bg-white border border-[#D0D0D0] space-y-4">
        <div className="flex justify-between items-center border-b border-[#D0D0D0] pb-2">
          <h2 className="text-xs font-bold text-[#222222] uppercase tracking-wider">
            System Telemetry Logs
          </h2>
          <button
            onClick={clearLogs}
            className="px-3 py-1 rounded bg-[#F8F9FA] border border-[#D0D0D0] text-[#222222] hover:bg-[#F2F4F6] text-xs font-semibold"
          >
            Clear Log Console
          </button>
        </div>

        <div className="bg-[#1E293B] text-slate-100 p-4 rounded text-xs font-mono min-h-[400px] max-h-[600px] overflow-y-auto space-y-1" ref={logsContainerRef}>
          {logs.length === 0 ? (
            <div className="text-slate-400">Log stream initialized. Awaiting system events...</div>
          ) : (
            logs.map((l) => (
              <div key={l.id} className="flex items-start gap-2">
                <span className="text-slate-400">[{l.timestamp}]</span>
                <span className={l.type === 'error' ? 'text-red-400' : l.type === 'success' ? 'text-emerald-400' : 'text-slate-200'}>
                  {l.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

