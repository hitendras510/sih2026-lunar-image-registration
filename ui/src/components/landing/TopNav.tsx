import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Compass, ArrowRight, Menu, X, Layers, Cpu, BarChart3, Info } from 'lucide-react';

export const TopNav: React.FC = () => {
  const { openWorkbench } = useApp();
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Official Government Agency Top Strip */}
      <div className="bg-slate-900 border-b border-slate-800 text-[11px] text-slate-300 py-1.5 px-6 hidden sm:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center font-mono">
          <span>INDIAN SPACE RESEARCH ORGANISATION · DEPARTMENT OF SPACE</span>
          <span className="text-sky-400 font-semibold">SIH 2026 · PROBLEM STATEMENT 26166</span>
        </div>
      </div>

      <header
        className={`sticky top-0 z-40 transition-all duration-200 ${
          isScrolled
            ? 'bg-slate-950/95 border-b border-slate-800 py-3 shadow-md'
            : 'bg-slate-950/80 border-b border-slate-800/60 py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <a href="#home" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white block leading-none">
                SELENE-MATCH
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Lunar Image Registration Portal</span>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#home" className="hover:text-sky-400 transition-colors">Overview</a>
            <a href="#mission" className="hover:text-sky-400 transition-colors">Problem Statement</a>
            <a href="#workflow" className="hover:text-sky-400 transition-colors">Pipeline Workflow</a>
            <a href="#technology" className="hover:text-sky-400 transition-colors">Algorithms</a>
            <a href="#results" className="hover:text-sky-400 transition-colors">Benchmarks</a>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={() => openWorkbench('dashboard')}
              className="px-4 py-2 text-xs font-semibold rounded-md bg-sky-600 hover:bg-sky-500 text-white transition-all flex items-center gap-2"
            >
              Open Workbench
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              className="md:hidden p-2 text-slate-300 hover:text-white"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-x-0 top-[60px] z-30 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 p-6 flex flex-col gap-4 text-sm font-medium text-slate-200 md:hidden">
          <a href="#home" onClick={() => setMobileOpen(false)} className="py-2 border-b border-slate-800">Overview</a>
          <a href="#mission" onClick={() => setMobileOpen(false)} className="py-2 border-b border-slate-800">Mission</a>
          <a href="#workflow" onClick={() => setMobileOpen(false)} className="py-2 border-b border-slate-800">Workflow</a>
          <a href="#technology" onClick={() => setMobileOpen(false)} className="py-2 border-b border-slate-800">Algorithms</a>
          <a href="#results" onClick={() => setMobileOpen(false)} className="py-2 border-b border-slate-800">Benchmarks</a>
          <button
            className="mt-2 py-3 text-sm font-semibold rounded-lg bg-sky-500 text-white flex items-center justify-center gap-2"
            onClick={() => {
              setMobileOpen(false);
              openWorkbench('dashboard');
            }}
          >
            Launch Workbench
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
};
