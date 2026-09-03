import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { ArrowRight, Layers, Satellite, ShieldCheck, Sparkles } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const { openWorkbench } = useApp();

  return (
    <section className="relative z-10 pt-10 pb-8 px-6 max-w-5xl mx-auto flex flex-col items-center text-center" id="home">
      {/* Project Category Tag */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#E8F1F8] text-[#1F4E79] border border-[#D0D0D0] text-xs font-mono mb-4">
        <span>Smart India Hackathon 2026 · Problem Statement 26166 · ISRO</span>
      </div>

      {/* Page Title (28-32px semibold) */}
      <h1 className="text-2xl sm:text-3xl font-bold text-[#222222] tracking-tight leading-snug max-w-3xl">
        Chandrayaan-2 Multi-Modal Lunar Image Registration System
      </h1>

      {/* Factual Technical Subtitle */}
      <p className="mt-3 text-sm sm:text-base text-[#555555] max-w-2xl leading-relaxed">
        This application performs automatic image correspondence matching and sub-pixel registration between Chandrayaan-2 optical imagery (OHRC, TMC-2, IIRS) and LRO reference datasets.
      </p>

      {/* Standard Action Buttons */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => openWorkbench('upload')}
          className="px-5 py-2.5 rounded bg-[#1F4E79] hover:bg-[#163A5C] text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-xs"
        >
          Open Registration Workspace
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => openWorkbench('dashboard')}
          className="px-5 py-2.5 rounded bg-white hover:bg-[#F2F4F6] text-[#222222] border border-[#D0D0D0] font-semibold text-xs transition-colors"
        >
          View System Overview
        </button>
      </div>

      {/* Feature Highlights Grid */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl text-left">
        <div className="p-5 rounded bg-white border border-[#D0D0D0]">
          <h3 className="font-bold text-[#222222] text-xs uppercase tracking-wider">Multi-Sensor Support</h3>
          <p className="text-xs text-[#555555] mt-1.5 leading-relaxed">
            Native support for Chandrayaan-2 OHRC, TMC-2, IIRS and LRO NAC imagery.
          </p>
        </div>

        <div className="p-5 rounded bg-white border border-[#D0D0D0]">
          <h3 className="font-bold text-[#222222] text-xs uppercase tracking-wider">Feature Matchers</h3>
          <p className="text-xs text-[#555555] mt-1.5 leading-relaxed">
            SIFT, ORB, SuperPoint, and LOFTR feature correspondence algorithms.
          </p>
        </div>

        <div className="p-5 rounded bg-white border border-[#D0D0D0]">
          <h3 className="font-bold text-[#222222] text-xs uppercase tracking-wider">Sub-Pixel RMSE</h3>
          <p className="text-xs text-[#555555] mt-1.5 leading-relaxed">
            MAGSAC++ outlier filtering and Thin Plate Spline piecewise warping.
          </p>
        </div>
      </div>
    </section>
  );
};
