import React from 'react';
import { motion } from 'framer-motion';
import { Target, Layers, Globe, ShieldCheck } from 'lucide-react';

export const MissionSection: React.FC = () => {
  return (
    <section id="mission" className="py-20 px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-3xl mx-auto mb-16"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
          01 / The Mission
        </span>
        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mt-2">
          Bridging Multi-Sensor Lunar Datasets
        </h2>
        <p className="text-slate-400 text-base mt-4 leading-relaxed">
          Lunar images captured across different missions (Chandrayaan-2 vs LRO) exhibit extreme illumination variations, shadow inversions, and resolution mismatches. SELENE solves this with robust sub-pixel georeferencing.
        </p>
      </motion.div>

      {/* Metrics Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4">
            <Target className="w-5 h-5" />
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">&lt; 0.5 px</div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Target RMSE Accuracy</div>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">Sub-pixel registration across high-resolution crater terrain.</p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
            <Layers className="w-5 h-5" />
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">320×</div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Max GSD Mismatch</div>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">Handles resolution scale differences from 0.25m to 80m GSD.</p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
            <Globe className="w-5 h-5" />
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">8 × 8</div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Adaptive GCP Grid</div>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">Cellular keypoint distribution guarantees uniform coverage.</p>
        </div>

        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">GeoTIFF</div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Geospatial Standard</div>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">PDS3 / PDS4 compliant output compatible with QGIS and ArcGIS.</p>
        </div>
      </div>
    </section>
  );
};
