import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { ArrowRight, Layers, Satellite, ShieldCheck, Sparkles } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const { openWorkbench } = useApp();

  return (
    <section className="relative z-10 pt-36 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center" id="home">
      {/* Kicker Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-semibold uppercase tracking-wider mb-6"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>ISRO Smart India Hackathon 2026 · Problem #26166</span>
      </motion.div>

      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1] max-w-5xl"
      >
        Precision <span className="text-sky-400">Lunar Image Registration</span> & Georeferencing Suite
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-6 text-lg sm:text-xl text-slate-400 max-w-3xl leading-relaxed font-medium"
      >
        Align Chandrayaan-2 (OHRC, TMC-2, IIRS) and LRO satellite pairs automatically. Handles extreme illumination variation, shadow shifts, and multi-resolution GSD mismatch with sub-pixel RMSE accuracy.
      </motion.p>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-10 flex flex-wrap items-center justify-center gap-4"
      >
        <button
          onClick={() => openWorkbench('upload')}
          className="px-6 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm transition-all flex items-center gap-2 shadow-lg shadow-sky-500/25"
        >
          Start Image Alignment
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => openWorkbench('dashboard')}
          className="px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm transition-all"
        >
          Explore Workbench
        </button>
      </motion.div>

      {/* Feature Highlights Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl text-left"
      >
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-3">
            <Satellite className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-white text-sm">Multi-Sensor Support</h3>
          <p className="text-xs text-slate-400 mt-1 leading-normal">
            OHRC (0.25m GSD), TMC-2 (5m GSD), LRO NAC, and PDS v3/v4 datasets.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-white text-sm">Hybrid Matchers</h3>
          <p className="text-xs text-slate-400 mt-1 leading-normal">
            SIFT, ORB, SuperPoint, and LOFTR deep learning correspondence models.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-white text-sm">Sub-Pixel Precision</h3>
          <p className="text-xs text-slate-400 mt-1 leading-normal">
            RANSAC & MAGSAC+ outlier filtering with Homography & Thin Plate Splines.
          </p>
        </div>
      </motion.div>
    </section>
  );
};
