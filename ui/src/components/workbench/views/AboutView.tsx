import React from 'react';
import { Moon } from 'lucide-react';

const techBadges = [
  'PYTHON',
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
    <section id="view-about" className="view-section active">
      <div className="mb-5">
        <div className="screen-title">About SELENE-MATCH</div>
        <div className="screen-subtitle">Project context and architecture at a glance.</div>
      </div>
      <div className="card bracket p-6 max-w-5xl">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl border border-[rgba(111,246,255,0.3)] bg-[rgba(57,168,255,0.08)] flex items-center justify-center shrink-0">
            <Moon className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h2 className="text-lg text-white font-semibold">
              Multi-modal Lunar Image Correspondence
            </h2>
            <p className="text-[12.5px] text-slate-400 mt-2 leading-relaxed max-w-2xl">
              SELENE-MATCH is designed to register Chandrayaan-2 OHRC, TMC-2 and IIRS imagery
              against LRO NAC/WAC references despite illumination, viewpoint and scale differences.
            </p>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-3 mt-6">
          <div className="panel p-4">
            <div className="mini-label">Scale</div>
            <div className="text-white mt-1.5 font-mono text-[11.5px]">Up to 320× GSD</div>
          </div>
          <div className="panel p-4">
            <div className="mini-label">Precision</div>
            <div className="text-white mt-1.5 font-mono text-[11.5px]">Sub-pixel target</div>
          </div>
          <div className="panel p-4">
            <div className="mini-label">Pipeline</div>
            <div className="text-white mt-1.5 font-mono text-[11.5px]">Stages S0–S8</div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-1.5">
          {techBadges.map((badge) => (
            <span key={badge} className="badge">
              {badge}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
