import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';

export const HeroSection: React.FC = () => {
  const { openWorkbench } = useApp();

  return (
    <section className="hero-centered-layout relative z-10 min-h-screen flex flex-col items-center justify-center pt-32 pb-20 text-center" id="home">
      <div className="hero-grid-bg" />

      {/* Orbit Rings Background Accent */}
      <div className="hero-orbits">
        <div className="hero-orbit o-bg1" />
        <div className="hero-orbit o-bg2" />
      </div>

      {/* CENTERED HERO COPY */}
      <motion.div
        className="hero-copy-centered z-20 max-w-4xl px-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.2, 0.6, 0.2, 1] }}
      >
        {/* Eyebrow with decorative lines */}
        <div className="eyebrow-line">
          <span className="line-left" />
          <span className="eyebrow-text">ISRO · LUNAR IMAGE REGISTRATION · 2026</span>
          <span className="line-right" />
        </div>

        {/* Main Heading */}
        <h1 className="hero-title-centered">
          <span className="title-solid">ALIGN</span>
          <span className="title-stroke">THE MOON.</span>
        </h1>

        {/* Description */}
        <p className="hero-desc-centered">
          <b>SELENE-MATCH</b> aligns Chandrayaan-2 OHRC, TMC-2 and IIRS imagery with LRO
          NAC/WAC reference data — across radically different resolution, illumination,
          and terrain conditions.
        </p>

        {/* Action Buttons */}
        <div className="hero-actions-centered">
          <button
            className="btn-centered-primary"
            onClick={() => openWorkbench('register')}
          >
            START REGISTRATION ↗
          </button>
          <button
            className="btn-centered-ghost"
            onClick={() => {
              document.querySelector('#mission')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            EXPLORE SYSTEM ↓
          </button>
        </div>

        {/* Status Line */}
        <div className="status-line-centered">
          <span>
            MISSION STATUS <span className="status-online"><i className="dot-green" /> ONLINE</span>
          </span>
          <span className="sep">•</span>
          <span>
            MODE <span className="status-val">AUTOMATIC</span>
          </span>
          <span className="sep">•</span>
          <span>
            GSD RANGE <span className="status-val">0.25m — 80m</span>
          </span>
        </div>
      </motion.div>

      {/* BOTTOM RIGHT SCROLL CUE */}
      <div className="scroll-cue-fixed">
        <span className="scroll-txt">SCROLL</span>
        <div className="scroll-orb-btn">
          <span className="scroll-dot" />
        </div>
      </div>
    </section>
  );
};
