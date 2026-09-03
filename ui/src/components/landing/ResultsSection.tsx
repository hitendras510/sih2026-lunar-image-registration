import React from 'react';
import { motion } from 'framer-motion';
import { BarChart2, CheckCircle2, Award } from 'lucide-react';

const benchmarkData = [
  { method: 'LOFTR (Transformer)', rmse: '0.42 px', inliers: '94.2%', latency: '1.2s', rating: 'Best Overall' },
  { method: 'SuperPoint + LightGlue', rmse: '0.51 px', inliers: '91.8%', latency: '0.8s', rating: 'High Precision' },
  { method: 'SIFT + MAGSAC++', rmse: '0.78 px', inliers: '84.5%', latency: '0.3s', rating: 'Fast Classic' },
  { method: 'ORB + RANSAC', rmse: '1.24 px', inliers: '76.1%', latency: '0.1s', rating: 'Real-Time' },
];

export const ResultsSection: React.FC = () => {
  return (
    <section id="results" className="py-20 px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-3xl mx-auto mb-16"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
          04 / Benchmark Verification
        </span>
        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mt-2">
          Empirical Accuracy & Performance
        </h2>
        <p className="text-slate-400 text-base mt-4 leading-relaxed">
          Every registration result is evaluated against ground truth lunar DEM models with full RMSE, SSIM, and PSNR diagnostics.
        </p>
      </motion.div>

      {/* Benchmark Table Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 md:p-8 backdrop-blur-md">
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-sky-400" />
            <h3 className="text-lg font-bold text-white">Algorithm Benchmark Performance</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">Evaluated on Chandrayaan-2 OHRC Pairs</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-mono font-semibold text-slate-400 uppercase">
                <th className="py-3 px-4">Extractor / Matcher</th>
                <th className="py-3 px-4">Mean RMSE</th>
                <th className="py-3 px-4">Inlier Ratio</th>
                <th className="py-3 px-4">Execution Time</th>
                <th className="py-3 px-4">Evaluation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm font-medium">
              {benchmarkData.map((row, i) => (
                <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-4 font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400" />
                    {row.method}
                  </td>
                  <td className="py-4 px-4 font-mono text-emerald-400 font-bold">{row.rmse}</td>
                  <td className="py-4 px-4 font-mono text-slate-200">{row.inliers}</td>
                  <td className="py-4 px-4 font-mono text-slate-400">{row.latency}</td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      <Award className="w-3 h-3" />
                      {row.rating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
