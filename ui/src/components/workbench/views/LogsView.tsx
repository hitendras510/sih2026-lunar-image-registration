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
    <section id="view-logs" className="view-section active space-y-6 pb-12">
      {/* PAGE HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Execution Log Console
        </h1>
        <div className="text-xs text-slate-400 font-mono tracking-wide mt-1">
          Real-time pipeline execution telemetry, backend service stdout/stderr, and diagnostic log history.
        </div>
      </div>

      {/* TERMINAL LOG CARD */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">
            Live Telemetry Log Stream
          </h3>
          <button
            onClick={clearLogs}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Logs
          </button>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mr-1.5" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-1.5" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2.5" />
            <span className="font-mono text-xs text-slate-400 font-semibold">
              system_telemetry.log
            </span>
          </div>

          <div
            ref={logsContainerRef}
            className="min-h-[460px] max-h-[600px] p-5 overflow-y-auto space-y-2 font-mono text-[11.5px] leading-relaxed overscroll-contain"
          >
            {logs.length === 0 ? (
              <div className="text-slate-500 font-mono text-[11.5px]">
                <span className="text-[#54738c] mr-2.5">[19:52:07]</span>
                <span className="text-[#e3f2fd]">SELENE-MATCH Workbench initialized. Log stream empty.</span>
              </div>
            ) : (
              logs.map((l) => (
                <div key={l.id} className="term-line flex items-start gap-2.5">
                  <span className="text-[#54738c] font-mono shrink-0">
                    [{l.timestamp}]
                  </span>
                  <span
                    className={
                      l.type === 'error'
                        ? 'text-red-400 font-mono'
                        : l.type === 'success'
                        ? 'text-emerald-400 font-mono'
                        : 'text-[#e3f2fd] font-mono'
                    }
                  >
                    {l.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

