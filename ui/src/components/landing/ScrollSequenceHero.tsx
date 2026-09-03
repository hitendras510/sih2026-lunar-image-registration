import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Sliders, GitMerge, CheckCircle, ArrowRight } from 'lucide-react';

export const ScrollSequenceHero: React.FC = () => {
  const { openWorkbench } = useApp();
  const [sliderPos, setSliderPos] = useState<number>(50);

  return (
    <div className="py-16 px-6 max-w-7xl mx-auto">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 md:p-8 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-sky-400" />
              Interactive Registration Preview
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Drag the curtain slider below to compare Reference (LRO NAC) vs Target (Chandrayaan-2 OHRC) lunar surface alignment.
            </p>
          </div>
          <button
            onClick={() => openWorkbench('upload')}
            className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition-all flex items-center gap-2 shrink-0"
          >
            Load Custom Image Pair
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Interactive Split Comparison Card */}
        <div className="relative mt-6 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden aspect-[16/9] max-h-[460px] select-none">
          {/* Reference Image (Underneath) */}
          <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
            <div className="relative w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950 p-8 flex flex-col justify-between">
              <div className="px-3 py-1 rounded bg-slate-900/80 border border-slate-700 text-[10px] font-mono text-sky-400 w-max">
                REF: LRO NAC (0.5m GSD)
              </div>
              <div className="grid grid-cols-6 gap-4 opacity-40">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="h-12 border border-slate-700/50 rounded flex items-center justify-center text-[10px] font-mono text-slate-500">
                    Crater #{i + 101}
                  </div>
                ))}
              </div>
              <div className="text-[10px] font-mono text-slate-500 text-right">
                Solar Elevation: 42.1°
              </div>
            </div>
          </div>

          {/* Registered Target Image (Overlaid with clip-path) */}
          <div
            className="absolute inset-0 bg-slate-950 flex items-center justify-center transition-all duration-75"
            style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
          >
            <div className="relative w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black p-8 flex flex-col justify-between border-r-2 border-sky-400">
              <div className="px-3 py-1 rounded bg-sky-950/80 border border-sky-600/40 text-[10px] font-mono text-emerald-400 w-max">
                REGISTERED: Chandrayaan-2 OHRC (0.25m GSD)
              </div>
              <div className="grid grid-cols-6 gap-4 opacity-70">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="h-12 border border-sky-500/30 bg-sky-500/5 rounded flex items-center justify-center text-[10px] font-mono text-sky-300">
                    Aligned #{i + 101}
                  </div>
                ))}
              </div>
              <div className="text-[10px] font-mono text-emerald-400 text-left flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> RMSE: 0.42 px (Sub-pixel Accurate)
              </div>
            </div>
          </div>

          {/* Slider Control Handle */}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
          />
          {/* Visual Divider Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-sky-400 pointer-events-none z-20 shadow-[0_0_12px_rgba(56,189,248,0.8)]"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-lg border border-white/20">
              <Sliders className="w-3.5 h-3.5 rotate-90" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
