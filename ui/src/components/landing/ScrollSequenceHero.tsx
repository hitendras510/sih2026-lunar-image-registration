import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValueEvent,
} from 'framer-motion';
import { useApp } from '../../context/AppContext';

const TOTAL_FRAMES = 150;

export const ScrollSequenceHero: React.FC = () => {
  const { openWorkbench } = useApp();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [loadedCount, setLoadedCount] = useState<number>(0);
  const [isPreloading, setIsPreloading] = useState<boolean>(true);

  // Framer Motion Scroll tracking
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Spring physics for buttery smooth 60fps scrolling
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 32,
    restDelta: 0.0001,
  });

  // Map progress (0..1) to frame index (0..149)
  const rawFrameIndex = useTransform(smoothProgress, [0, 1], [0, TOTAL_FRAMES - 1]);

  // Framer Motion scroll animations for Hero UI text
  const titleOpacity = useTransform(smoothProgress, [0, 0.25, 0.38], [1, 1, 0]);
  const titleY = useTransform(smoothProgress, [0, 0.38], [0, -60]);
  const titleScale = useTransform(smoothProgress, [0, 0.38], [1, 0.92]);

  const descOpacity = useTransform(smoothProgress, [0, 0.2, 0.34], [1, 1, 0]);
  const statusOpacity = useTransform(smoothProgress, [0, 0.18, 0.3], [1, 1, 0]);

  // Floating sequence overlay cards as you scroll through the 3D moon
  const feature1Opacity = useTransform(smoothProgress, [0.32, 0.42, 0.58, 0.68], [0, 1, 1, 0]);
  const feature1Y = useTransform(smoothProgress, [0.32, 0.42, 0.68], [30, 0, -30]);

  const feature2Opacity = useTransform(smoothProgress, [0.55, 0.65, 0.8, 0.9], [0, 1, 1, 0]);
  const feature2Y = useTransform(smoothProgress, [0.55, 0.65, 0.9], [30, 0, -30]);

  // Preload all 150 WebP frames into memory
  useEffect(() => {
    let isMounted = true;
    const loadedImages: HTMLImageElement[] = [];
    let count = 0;

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      const padNum = String(i).padStart(3, '0');
      img.src = `/sequence/frame_${padNum}_delay-0.067s.webp`;

      img.onload = () => {
        if (!isMounted) return;
        count++;
        setLoadedCount(count);
        if (count === TOTAL_FRAMES) {
          setIsPreloading(false);
        }
      };

      img.onerror = () => {
        if (!isMounted) return;
        count++;
        setLoadedCount(count);
        if (count === TOTAL_FRAMES) {
          setIsPreloading(false);
        }
      };

      loadedImages.push(img);
    }

    setImages(loadedImages);

    return () => {
      isMounted = false;
    };
  }, []);

  // Draw target frame onto Canvas
  const drawFrame = useCallback(
    (index: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const clampedIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.floor(index)));
      const img = images[clampedIndex];

      if (!img || !img.complete || img.naturalWidth === 0) return;

      const dpr = window.devicePixelRatio || 1;
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, displayWidth, displayHeight);

      // Fit image contained / centered cleanly in canvas
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const canvasRatio = displayWidth / displayHeight;

      let drawWidth = displayWidth;
      let drawHeight = displayHeight;
      let offsetX = 0;
      let offsetY = 0;

      if (canvasRatio > imgRatio) {
        drawHeight = displayHeight;
        drawWidth = displayHeight * imgRatio;
        offsetX = (displayWidth - drawWidth) / 2;
      } else {
        drawWidth = displayWidth;
        drawHeight = displayWidth / imgRatio;
        offsetY = (displayHeight - drawHeight) / 2;
      }

      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    },
    [images]
  );

  // Redraw when frame changes or resizes
  useMotionValueEvent(rawFrameIndex, 'change', (latest) => {
    drawFrame(latest);
  });

  useEffect(() => {
    drawFrame(rawFrameIndex.get());
  }, [drawFrame, rawFrameIndex, isPreloading]);

  useEffect(() => {
    const handleResize = () => {
      drawFrame(rawFrameIndex.get());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawFrame, rawFrameIndex]);

  return (
    <div ref={containerRef} className="relative w-full h-[320vh] bg-[#020409]">
      {/* Sticky Fullscreen Container */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        {/* Background Grid */}
        <div className="hero-grid-bg" />

        {/* 3D Canvas Image Sequence */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
        />

        {/* Preloader overlay if loading frames */}
        {isPreloading && (
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2 font-mono text-[10px] text-cyan-400 bg-slate-900/80 px-3 py-1.5 rounded-full border border-cyan-500/30 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            LOADING SEQUENCE {Math.round((loadedCount / TOTAL_FRAMES) * 100)}%
          </div>
        )}

        {/* CENTERED HERO TEXT CONTENT */}
        <motion.div
          style={{ opacity: titleOpacity, y: titleY, scale: titleScale }}
          className="hero-copy-centered z-20 pointer-events-auto px-4"
        >
          {/* Eyebrow with side lines */}
          <div className="eyebrow-line">
            <span className="line-left" />
            <span className="eyebrow-text">ISRO · LUNAR IMAGE REGISTRATION · 2026</span>
            <span className="line-right" />
          </div>

          {/* Main Title */}
          <h1 className="hero-title-centered">
            <span className="title-solid">ALIGN</span>
            <span className="title-stroke">THE MOON.</span>
          </h1>

          {/* Subtitle */}
          <motion.p style={{ opacity: descOpacity }} className="hero-desc-centered">
            <b>SELENE-MATCH</b> aligns Chandrayaan-2 OHRC, TMC-2 and IIRS imagery with LRO
            NAC/WAC reference data — across radically different resolution, illumination,
            and terrain conditions.
          </motion.p>

          {/* Action Buttons */}
          <motion.div style={{ opacity: descOpacity }} className="hero-actions-centered">
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
          </motion.div>

          {/* Status Line */}
          <motion.div style={{ opacity: statusOpacity }} className="status-line-centered">
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
          </motion.div>
        </motion.div>

        {/* FLOATING SEQUENCE CARDS AS YOU SCROLL DEEPER */}
        <motion.div
          style={{ opacity: feature1Opacity, y: feature1Y }}
          className="absolute left-8 md:left-16 top-1/2 -translate-y-1/2 z-30 pointer-events-none max-w-xs"
        >
          <div className="card bracket p-4 backdrop-blur-xl bg-slate-950/80 border border-cyan-500/30 shadow-[0_0_40px_rgba(111,246,255,0.15)]">
            <div className="mini-label text-cyan-400">SCROLL DYNAMICS</div>
            <div className="text-white font-medium mt-1 text-sm">320× GSD Pyramid</div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Seamlessly resolves multi-resolution disparity between Chandrayaan-2 and LRO.
            </p>
          </div>
        </motion.div>

        <motion.div
          style={{ opacity: feature2Opacity, y: feature2Y }}
          className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 z-30 pointer-events-none max-w-xs"
        >
          <div className="card bracket p-4 backdrop-blur-xl bg-slate-950/80 border border-success/30 shadow-[0_0_40px_rgba(62,230,160,0.15)]">
            <div className="mini-label text-success">SUB-PIXEL PRECISION</div>
            <div className="text-white font-medium mt-1 text-sm">MAGSAC++ &amp; IC-LK</div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Sub-pixel control point refinement guarantees &lt;1.0 px RMSE target accuracy.
            </p>
          </div>
        </motion.div>

        {/* SCROLL CUE */}
        <div className="scroll-cue-fixed">
          <span className="scroll-txt">SCROLL TO ANIMATE</span>
          <div className="scroll-orb-btn">
            <span className="scroll-dot" />
          </div>
        </div>
      </div>
    </div>
  );
};
