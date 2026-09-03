import React from 'react';
import { ArrowUp, Compass } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="border-t border-[#D0D0D0] bg-white py-8 px-6 text-xs text-[#555555]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="font-bold text-[#222222] text-sm block">
            SELENE-MATCH
          </span>
          <span className="text-xs text-[#555555]">Chandrayaan-2 Multi-Modal Lunar Image Registration System · Smart India Hackathon 2026</span>
        </div>

        <div className="flex items-center gap-6 text-xs font-semibold text-[#555555]">
          <a href="#home" className="hover:text-[#1F4E79] transition-colors">Overview</a>
          <a href="#mission" className="hover:text-[#1F4E79] transition-colors">Problem Statement</a>
          <a href="#workflow" className="hover:text-[#1F4E79] transition-colors">Workflow</a>
          <a href="#technology" className="hover:text-[#1F4E79] transition-colors">Algorithms</a>
          <a href="#results" className="hover:text-[#1F4E79] transition-colors">Benchmarks</a>
        </div>

        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="px-3 py-1.5 rounded border border-[#D0D0D0] bg-[#F8F9FA] text-[#222222] hover:bg-[#F2F4F6] transition-colors text-xs font-semibold"
        >
          Back to Top
        </button>
      </div>
    </footer>
  );
};
