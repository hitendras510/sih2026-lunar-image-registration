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
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-200 ${
          isScrolled
            ? 'bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 py-3 shadow-md'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <a href="#home" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:border-sky-400 transition-colors">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white block leading-none">
                SELENE<span className="text-sky-400">·</span>MATCH
              </span>
              <span className="text-[10px] font-medium tracking-widest text-slate-400 uppercase">ISRO Lunar Workbench</span>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <a href="#home" className="hover:text-sky-400 transition-colors">Overview</a>
            <a href="#mission" className="hover:text-sky-400 transition-colors">Mission</a>
            <a href="#workflow" className="hover:text-sky-400 transition-colors">Workflow</a>
            <a href="#technology" className="hover:text-sky-400 transition-colors">Algorithms</a>
            <a href="#results" className="hover:text-sky-400 transition-colors">Benchmarks</a>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={() => openWorkbench('dashboard')}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-sky-500 text-white hover:bg-sky-400 transition-all flex items-center gap-2 shadow-lg shadow-sky-500/20"
            >
              Launch Workbench
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
