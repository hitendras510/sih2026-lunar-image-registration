import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Zap, GitMerge, Sliders, CheckCircle2 } from 'lucide-react';

export const TechnologySection: React.FC = () => {
  return (
    <section id="technology" className="py-20 px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-3xl mx-auto mb-16"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
          03 / Algorithm Architecture
        </span>
        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mt-2">
          Adaptive Multi-Modal Matching Engine
        </h2>
        <p className="text-slate-400 text-base mt-4 leading-relaxed">
          Instead of relying on a single algorithm, SELENE dynamically routes lunar image pairs to the optimal feature extractor based on solar elevation, sensor modality, and resolution gap.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Card 1: Traditional CV Feature Matchers */}
        <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-6">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Traditional Feature Extraction</h3>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            High-speed scale-invariant feature transform (SIFT) and oriented FAST & rotated BRIEF (ORB) extractors for fast keypoint detection under uniform illumination.
          </p>

          <div className="mt-6 pt-6 border-t border-slate-800 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> SIFT Keypoints
              </span>
              <span className="text-slate-500">128D Descriptor</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> ORB Binary Matcher
              </span>
              <span className="text-slate-500">Fast Hamming Distance</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Phase Correlation
              </span>
              <span className="text-slate-500">FFT Frequency Shift</span>
            </div>
          </div>
        </div>

        {/* Card 2: Deep Learning Neural Matchers */}
        <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Deep Learning Neural Matchers</h3>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Transformer-based semi-dense models (LOFTR, SuperPoint + LightGlue) capable of matching extreme shadow shifts, crater rim distortion, and low-contrast surface terrain.
          </p>

          <div className="mt-6 pt-6 border-t border-slate-800 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400" /> LOFTR Detector-Free
              </span>
              <span className="text-slate-500">Coarse-to-Fine Transformer</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400" /> SuperPoint + LightGlue
              </span>
              <span className="text-slate-500">Graph Neural Network</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400" /> MAGSAC++ Filtering
              </span>
              <span className="text-slate-500">Marginalized Sample Consensus</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
