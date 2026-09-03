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
      <div className="pb-3 border-b border-[#D0D0D0]">
        <h1 className="text-xl font-bold text-[#222222]">
          About Project
        </h1>
        <p className="text-xs text-[#555555] mt-0.5">
          Smart India Hackathon 2026 · Problem Statement 26166 · ISRO
        </p>
      </div>

      {/* ABOUT CARD */}
      <div className="p-6 rounded bg-white border border-[#D0D0D0] max-w-5xl space-y-6">
        <div>
          <h2 className="text-base font-bold text-[#222222]">
            Chandrayaan-2 Multi-Modal Lunar Image Registration System
          </h2>
          <p className="text-xs text-[#555555] mt-2 leading-relaxed max-w-3xl">
            SELENE-MATCH performs automated keypoint correspondence matching and sub-pixel georeferencing between Chandrayaan-2 (OHRC, TMC-2, IIRS) optical imagery and LRO reference datasets across varying solar illumination angles, GSD scale disparities, and orbital sensor geometries.
          </p>
        </div>

        {/* METADATA HIGHLIGHTS */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded bg-[#F8F9FA] border border-[#D0D0D0]">
            <div className="text-xs font-semibold text-[#555555] uppercase">Scale Disparity</div>
            <div className="text-sm font-bold text-[#1F4E79] font-mono mt-1">Up to 320× GSD</div>
          </div>
          <div className="p-4 rounded bg-[#F8F9FA] border border-[#D0D0D0]">
            <div className="text-xs font-semibold text-[#555555] uppercase">Accuracy Target</div>
            <div className="text-sm font-bold text-[#2E7D32] font-mono mt-1">&lt; 0.5 px RMSE</div>
          </div>
          <div className="p-4 rounded bg-[#F8F9FA] border border-[#D0D0D0]">
            <div className="text-xs font-semibold text-[#555555] uppercase">Pipeline Stages</div>
            <div className="text-sm font-bold text-[#222222] font-mono mt-1">9 Stages Automated</div>
          </div>
        </div>

        {/* TECH STACK BADGES */}
        <div className="pt-2">
          <label className="text-xs font-semibold text-[#555555] uppercase tracking-wider block mb-2">
            Technology Stack
          </label>
          <div className="flex flex-wrap gap-2">
            {techBadges.map((badge) => (
              <span
                key={badge}
                className="font-mono text-xs text-[#222222] bg-[#F8F9FA] border border-[#D0D0D0] px-2.5 py-1 rounded"
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

