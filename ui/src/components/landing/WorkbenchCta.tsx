import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';

export const WorkbenchCta: React.FC = () => {
  const { openWorkbench } = useApp();

  return (
    <motion.section
      id="team"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.8, ease: [0.2, 0.6, 0.2, 1] }}
    >
      <div className="launch">
        <div>
          <div className="kicker">05 / THE WORKBENCH</div>
          <h2>
            Ready to
            <br />
            <span className="thin">register the Moon?</span>
          </h2>
          <p>
            Upload a source and reference image, inspect metadata, run the S0–S8
            pipeline, compare the registration and download the final products
            from the SELENE-MATCH Workbench.
          </p>
          <div className="check">
            <span>PAIR UPLOAD</span>
            <span>LIVE PIPELINE</span>
            <span>COMPARISON VIEW</span>
            <span>EXPORTS</span>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => openWorkbench('dashboard')}
          >
            ENTER WORKBENCH ↗
          </button>
        </div>
        <div className="specs">
          <div>
            PROJECT TYPE / <b>LUNAR CV</b>
          </div>
          <div>
            INPUT / <b>PDS · GEOTIFF</b>
          </div>
          <div>
            OUTPUT / <b>REGISTERED TIFF</b>
          </div>
          <div>
            API / <b>FASTAPI</b>
          </div>
          <div>
            UI / <b>REACT · VITE</b>
          </div>
        </div>
      </div>
    </motion.section>
  );
};
