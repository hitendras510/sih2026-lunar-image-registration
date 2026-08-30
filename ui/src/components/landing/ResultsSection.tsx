import React from 'react';
import { motion } from 'framer-motion';

export const ResultsSection: React.FC = () => {
  return (
    <motion.section
      id="results"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.8, ease: [0.2, 0.6, 0.2, 1] }}
    >
      <div className="section-head">
        <div>
          <div className="kicker">04 / THE RESULT</div>
          <h2>
            Don't just
            <br />
            <span className="thin">look aligned.</span>
          </h2>
        </div>
        <p>
          Every registration is backed by measurable evidence and visual
          diagnostics rather than relying only on a subjective overlay.
        </p>
      </div>

      <div className="metrics">
        <div className="metric">
          <div className="num">RMSE</div>
          <div className="label">GEOMETRIC ERROR</div>
        </div>
        <div className="metric">
          <div className="num">CE90</div>
          <div className="label">90% ERROR RADIUS</div>
        </div>
        <div className="metric">
          <div className="num">NNI</div>
          <div className="label">GCP UNIFORMITY</div>
        </div>
        <div className="metric">
          <div className="num">8×8</div>
          <div className="label">GRID COVERAGE</div>
        </div>
      </div>

      <div className="residual">
        <motion.div
          className="residual-vis"
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <span className="rlabel tag" style={{ margin: 0 }}>
            RESIDUAL HEATMAP / DEMO
          </span>
          <svg
            className="quiver"
            viewBox="0 0 100 60"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <g stroke="rgba(234,246,255,.5)" strokeWidth="0.28" markerEnd="url(#ah)">
              <line x1="22" y1="18" x2="25.2" y2="16.4" />
              <line x1="48" y1="30" x2="44.1" y2="31.8" />
              <line x1="70" y1="14" x2="73.4" y2="16.2" />
              <line x1="34" y1="44" x2="37" y2="42.2" />
              <line x1="82" y1="40" x2="79.2" y2="42.4" />
              <line x1="58" y1="50" x2="61.3" y2="48.6" />
            </g>
            <defs>
              <marker
                id="ah"
                markerWidth="4"
                markerHeight="4"
                refX="3"
                refY="2"
                orient="auto"
              >
                <path d="M0,0 L4,2 L0,4 z" fill="rgba(234,246,255,.75)" />
              </marker>
            </defs>
          </svg>
        </motion.div>

        <motion.div
          className="residual-side"
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h4>DIAGNOSTIC LAYERS</h4>
          <div className="legend">
            <div>
              <i style={{ background: '#3b82f6' }} />
              RESIDUAL · LOW<b>&lt; 0.3 px</b>
            </div>
            <div>
              <i style={{ background: '#10b981' }} />
              RESIDUAL · NOMINAL<b>&lt; 1.0 px</b>
            </div>
            <div>
              <i style={{ background: '#ef4444' }} />
              RESIDUAL · FLAGGED<b>≥ 2.0 px</b>
            </div>
            <div>
              <i style={{ background: 'rgba(111,246,255,.7)' }} />
              CURTAIN SWEEP<b>WIPE X</b>
            </div>
            <div>
              <i style={{ background: 'transparent', border: '1px dashed rgba(146,196,255,.5)' }} />
              GCP VECTORS<b>QUIVER</b>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};
