import React from 'react';
import { motion } from 'framer-motion';

const flowItems = [
  {
    stage: 'S0 — S2',
    title: 'INGEST + PREPARE',
    desc: 'Read PDS/GeoTIFF metadata, equalize GSD, normalize imagery and prepare illumination-robust representations.',
    width: '33%',
  },
  {
    stage: 'S3 — S4',
    title: 'CHOOSE + MATCH',
    desc: 'An automatic gate selects the appropriate matcher, then generates candidate correspondences.',
    width: '56%',
  },
  {
    stage: 'S5 — S6',
    title: 'FILTER + REFINE',
    desc: 'MAGSAC++ removes false matches. IC-LK refines validated control points toward sub-pixel precision.',
    width: '78%',
  },
  {
    stage: 'S7 — S8',
    title: 'ALIGN + PROVE',
    desc: 'Uniform GCPs drive the final warp, followed by RMSE, CE90, NNI, coverage and product generation.',
    width: '100%',
  },
];

export const WorkflowSection: React.FC = () => {
  return (
    <motion.section
      id="workflow"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.8, ease: [0.2, 0.6, 0.2, 1] }}
    >
      <div className="section-head">
        <div>
          <div className="kicker">02 / HOW IT WORKS</div>
          <h2>
            From pixels
            <br />
            <span className="thin">to precision.</span>
          </h2>
        </div>
        <p>
          The system does not jump directly into matching. It progressively
          removes scale, illumination and geometric differences before
          performing sub-pixel refinement.
        </p>
      </div>

      <div className="flow">
        {flowItems.map((item, idx) => (
          <motion.div
            key={item.stage}
            className="flow-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.12 }}
          >
            <div className="n">{item.stage}</div>
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
            <div className="bar">
              <i style={{ width: item.width }} />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};
