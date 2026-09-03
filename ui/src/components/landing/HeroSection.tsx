import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { ArrowRight, Layers, Satellite, ShieldCheck, Sparkles } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const { openWorkbench } = useApp();

  return (
    <section className="relative z-10 pt-12 pb-12 px-6 max-w-7xl mx-auto flex flex-col items-center text-center" id="home">
      {/* Official Kicker Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="inline-flex items-center gap-2 px-3.5 py-1 rounded bg-slate-900 text-sky-400 border border-slate-800 text-xs font-mono font-semibold uppercase tracking-wider mb-6"
      >
        <span>ISRO Smart India Hackathon 2026 · Problem Statement #26166</span>
      </motion.div>

      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight max-w-4xl"
      >
        Chandrayaan-2 Lunar Image Registration &amp; Georeferencing Suite
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mt-4 text-base sm:text-lg text-slate-400 max-w-3xl leading-relaxed font-normal"
      >
        Automated alignment of Chandrayaan-2 (OHRC, TMC-2, IIRS) imagery with LRO reference datasets. Resolves extreme solar elevation disparity, crater distortion, and scale mismatch with sub-pixel precision.
      </motion.p>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="mt-8 flex flex-wrap items-center justify-center gap-4"
      >
        <button
          onClick={() => openWorkbench('upload')}
          className="px-6 py-3 rounded-md bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-md"
        >
          Select &amp; Upload Image Pair
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => openWorkbench('dashboard')}
          className="px-6 py-3 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold text-xs transition-all"
        >
          Open Portal Dashboard
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
