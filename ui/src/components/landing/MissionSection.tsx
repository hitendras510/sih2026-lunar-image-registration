import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export const MissionSection: React.FC = () => {
  const [maxGsd, setMaxGsd] = useState<number>(0);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = 320;
            const duration = 1400;
            const startTime = performance.now();

            const animate = (now: number) => {
              const elapsed = now - startTime;
              const progress = Math.min(elapsed / duration, 1);
              const value = Math.round(target * (1 - Math.pow(1 - progress, 3)));
              setMaxGsd(value);
              if (progress < 1) {
                requestAnimationFrame(animate);
              }
            };
            requestAnimationFrame(animate);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <motion.section
      id="mission"
      ref={sectionRef}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.8, ease: [0.2, 0.6, 0.2, 1] }}
    >
      <div className="section-head">
        <div>
          <div className="kicker">01 / THE MISSION</div>
          <h2>
            One surface.
            <br />
            <span className="thin">Many views.</span>
          </h2>
        </div>
        <p>
          Lunar images from different sensors do not naturally line up.
          SELENE-MATCH creates a reliable correspondence between them and
          produces a registered, measurable final product.
        </p>
      </div>

      <motion.div
        className="metrics"
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="metric">
          <div className="num">{maxGsd}×</div>
          <div className="label">MAX GSD DIFFERENCE</div>
        </div>
        <div className="metric">
          <div className="num">&lt;1 px</div>
          <div className="label">TARGET RMSE</div>
        </div>
        <div className="metric">
          <div className="num">8×8</div>
          <div className="label">GCP GRID</div>
        </div>
        <div className="metric">
          <div className="num">S0—S8</div>
          <div className="label">PROCESSING STAGES</div>
        </div>
      </motion.div>
    </motion.section>
  );
};
