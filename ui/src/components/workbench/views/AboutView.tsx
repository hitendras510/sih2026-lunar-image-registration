import React from 'react';
import { Moon } from 'lucide-react';

const techBadges = [
  'PYTHON 3.11',
  'NUMPY',
  'GDAL',
  'RASTERIO',
  'OPENCV',
  'KORNIA',
  'PYTORCH',
  'FASTAPI',
  'REACT / VITE / TS',
  'GRADIO',
];

export const AboutView: React.FC = () => {
  return (
    <section id="view-about" className="view-section active space-y-6">
      {/* PAGE HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          About SELENE-MATCH
        </h1>
        <div className="text-xs text-slate-400 font-mono tracking-wide mt-1">
          Multi-modal lunar image correspondence, automatic matcher gate routing, and pipeline architecture.
        </div>
      </div>

      {/* ABOUT CARD */}
      <div className="p-6 sm:p-8 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md max-w-5xl space-y-7">
        <div className="flex items-start gap-5">
          <div className="w-12 h-12 rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
            <Moon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg text-white font-bold tracking-tight">
              Multi-modal Lunar Image Correspondence &amp; Sub-pixel Registration
            </h2>
            <p className="text-xs text-slate-300 font-mono mt-2 leading-relaxed max-w-3xl">
              SELENE-MATCH is designed to register Chandrayaan-2 OHRC, TMC-2 and IIRS imagery
              against LRO NAC/WAC references despite severe illumination angle differences, viewpoint distortion, and large spatial resolution disparity.
            </p>
          </div>
        </div>

        {/* METADATA HIGHLIGHTS */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Scale Disparity</div>
            <div className="text-sm font-bold text-sky-400 font-mono mt-1">Up to 320× GSD</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400 tracking-[0.12em] uppercase">
              <span className="text-cyan-400">•</span> ACCURACY TARGET
            </div>
            <div className="text-emerald-400 mt-2 font-mono text-[13px] font-bold">
              Sub-pixel (&lt; 1.0 px)
            </div>
          </div>
          <div className="panel p-4 rounded-xl bg-[#07111b]/80 border border-[rgba(146,196,255,0.12)]">
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400 tracking-[0.12em] uppercase">
              <span className="text-cyan-400">•</span> PIPELINE STAGES
            </div>
            <div className="text-white mt-2 font-mono text-[13px] font-bold">
              Stages 0 to 8
            </div>
          </div>
        </div>

        {/* TECH STACK BADGES */}
        <div className="pt-2">
          <label className="font-mono text-[10.5px] font-semibold text-slate-400 tracking-[0.14em] uppercase block mb-3">
            • CORE TECHNOLOGY STACK
          </label>
          <div className="flex flex-wrap gap-2">
            {techBadges.map((badge) => (
              <span
                key={badge}
                className="badge font-mono text-[10px] tracking-[0.12em] text-slate-300 bg-slate-900/80 border border-slate-700/60 px-3.5 py-1.5 rounded-lg"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

