import React from 'react';
import { ArrowUp, Compass } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-12 px-6 text-sm text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white text-base block leading-none">
              SELENE<span className="text-sky-400">·</span>MATCH
            </span>
            <span className="text-xs text-slate-500">ISRO Smart India Hackathon 2026</span>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs font-medium">
          <a href="#home" className="hover:text-white transition-colors">Home</a>
          <a href="#mission" className="hover:text-white transition-colors">Mission</a>
          <a href="#workflow" className="hover:text-white transition-colors">Workflow</a>
          <a href="#technology" className="hover:text-white transition-colors">Algorithms</a>
          <a href="#results" className="hover:text-white transition-colors">Benchmarks</a>
        </div>

        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="p-2.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-700 transition-all flex items-center gap-2 text-xs font-semibold"
        >
          Back to Top
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
      </div>
    </footer>
  );
};
