import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { ArrowRight, Layers, Satellite, ShieldCheck, Sparkles } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const { openWorkbench } = useApp();

  return (
    <section className="relative z-10 pt-10 pb-8 px-6 max-w-6xl mx-auto flex flex-col items-center text-center" id="home">
      {/* Project Category Tag */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono mb-4">
        <span>ISRO SIH 2026 · Problem Statement 26166</span>
      </div>

      {/* Page Title (28-32px semibold) */}
      <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug max-w-3xl">
        Chandrayaan-2 Lunar Image Registration &amp; Correspondence Engine
      </h1>

      {/* Factual Technical Subtitle */}
      <p className="mt-3 text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
        Automatic correspondence matching and sub-pixel georeferencing between Chandrayaan-2 optical imagery (OHRC, TMC-2, IIRS) and LRO reference datasets.
      </p>

      {/* Standard Action Buttons */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => openWorkbench('upload')}
          className="px-5 py-2.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center gap-2"
        >
          Start Image Registration
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => openWorkbench('dashboard')}
          className="px-5 py-2.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors"
        >
          Open Technical Workspace
        </button>
      </div>

      {/* Feature Highlights Grid */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-5 w-full max-w-4xl text-left">
        <div className="p-5 rounded-lg border border-slate-800 bg-slate-900">
          <div className="w-8 h-8 rounded bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
            <Satellite className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-white text-xs">Multi-Sensor Data Ingestion</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Native support for Chandrayaan-2 (OHRC, TMC-2, IIRS) and LRO datasets.
          </p>
        </div>

        <div className="p-5 rounded-lg border border-slate-800 bg-slate-900">
          <div className="w-8 h-8 rounded bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
            <Layers className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-white text-xs">Adaptive Feature Extractors</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            SIFT, ORB, SuperPoint, and LOFTR feature correspondence engines.
          </p>
        </div>

        <div className="p-5 rounded-lg border border-slate-800 bg-slate-900">
          <div className="w-8 h-8 rounded bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-white text-xs">Sub-Pixel Accuracy</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            MAGSAC++ outlier filtering and Thin Plate Spline piecewise warping.
          </p>
        </div>
      </div>
    </section>
  );
};
