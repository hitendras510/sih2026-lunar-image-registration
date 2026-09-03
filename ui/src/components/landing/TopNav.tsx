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
      <header className="sticky top-0 z-40 bg-[#1F4E79] text-white border-b border-[#163A5C] py-3 px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <a href="#home" className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold text-xs">
              S
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white block">
                SELENE-MATCH
              </span>
              <span className="text-[10px] text-blue-100">Chandrayaan-2 Multi-Modal Lunar Image Registration</span>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-blue-100">
            <a href="#home" className="hover:text-white transition-colors">Overview</a>
            <a href="#mission" className="hover:text-white transition-colors">Problem Statement</a>
            <a href="#workflow" className="hover:text-white transition-colors">Workflow</a>
            <a href="#technology" className="hover:text-white transition-colors">Algorithms</a>
            <a href="#results" className="hover:text-white transition-colors">Benchmarks</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => openWorkbench('dashboard')}
              className="px-4 py-2 text-xs font-semibold rounded bg-[#163A5C] hover:bg-[#122e49] text-white transition-colors border border-white/20"
            >
              Open Workbench
            </button>

            <button
              className="md:hidden p-1.5 text-white"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
