import React from 'react';
import { motion } from 'framer-motion';

export const TechnologySection: React.FC = () => {
  return (
    <motion.section
      id="technology"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.8, ease: [0.2, 0.6, 0.2, 1] }}
    >
      <div className="section-head">
        <div>
          <div className="kicker">03 / TECHNOLOGY</div>
          <h2>
            A specialist
            <br />
            <span className="thin">for every problem.</span>
          </h2>
        </div>
        <p>
          Instead of forcing one algorithm onto every lunar image pair,
          SELENE-MATCH uses a gated strategy that selects the most suitable
          technique from the scene conditions.
        </p>
      </div>

      <motion.div
        className="gate"
        initial={{ opacity: 0, scale: 0.97 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.15 }}
      >
        <div className="gate-head">
          <b>MATCHER GATE / AUTO ROUTING</b>
          <span>LIVE SELECTION LOGIC</span>
        </div>
        <div className="gate-flow">
          <div className="gate-node">SCENE METADATA</div>
          <div className="gate-link" />
          <div className="gate-node">SENSOR + SUN ANGLE</div>
          <div className="gate-link" />
          <div className="gate-node core">GATE</div>
          <div className="gate-link" />
          <div className="gate-specs">
            <div className="gate-node hot">LIGHTGLUE ●</div>
            <div className="gate-node">SIFT</div>
            <div className="gate-node">CRATER GRAPH</div>
            <div className="gate-node">PHASE CORR</div>
            <div className="gate-node">MUTUAL INFO</div>
          </div>
        </div>
      </motion.div>

      <div className="explain">
        <motion.div
          className="panel bracket"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3>
            Computer Vision Core<em>CORE</em>
          </h3>
          <p>
            Illumination preparation, feature extraction, correspondence,
            robust geometry and sub-pixel refinement work together as one
            registration pipeline.
          </p>
          <div style={{ marginTop: '20px' }}>
            <span className="tag">OPENCV</span>
            <span className="tag">RASTERIO</span>
            <span className="tag">GDAL</span>
            <span className="tag">NUMPY</span>
            <span className="tag">PYTORCH</span>
            <span className="tag">KORNIA</span>
            <span className="tag">MAGSAC++</span>
            <span className="tag">IC-LK</span>
          </div>
        </motion.div>

        <motion.div
          className="panel bracket"
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h3>
            Matcher Ensemble<em>ENSEMBLE</em>
          </h3>
          <p>
            LightGlue, SIFT, Phase Correlation, Mutual Information, Dense
            Matching and the Crater Graph strategy can be routed according
            to sensor modality and illumination conditions.
          </p>
          <div style={{ marginTop: '20px' }}>
            <span className="tag">LIGHTGLUE</span>
            <span className="tag">SIFT</span>
            <span className="tag">CRATER GRAPH</span>
            <span className="tag">PHASE CORR</span>
            <span className="tag">MUTUAL INFO</span>
            <span className="tag">RoMa</span>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};
