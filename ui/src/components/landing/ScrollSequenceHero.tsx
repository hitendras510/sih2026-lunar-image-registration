import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { Sliders, GitMerge, CheckCircle, ArrowRight } from 'lucide-react';

export const ScrollSequenceHero: React.FC = () => {
  const { openWorkbench } = useApp();
  const [sliderPos, setSliderPos] = useState<number>(50);

  return (
    <div className="py-16 px-6 max-w-7xl mx-auto">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 md:p-8 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-sky-400" />
              Interactive Registration Preview
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Drag the curtain slider below to compare Reference (LRO NAC) vs Target (Chandrayaan-2 OHRC) lunar surface alignment.
            </p>
          </div>
          <button
            onClick={() => openWorkbench('upload')}
            className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition-all flex items-center gap-2 shrink-0"
          >
            Load Custom Image Pair
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Interactive Split Comparison Card */}
        <div className="relative mt-6 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden aspect-[16/9] max-h-[460px] select-none">
          {/* Reference Image (Underneath) */}
          <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
            <div className="relative w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950 p-8 flex flex-col justify-between">
              <div className="px-3 py-1 rounded bg-slate-900/80 border border-slate-700 text-[10px] font-mono text-sky-400 w-max">
                REF: LRO NAC (0.5m GSD)
              </div>
              <div className="grid grid-cols-6 gap-4 opacity-40">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="h-12 border border-slate-700/50 rounded flex items-center justify-center text-[10px] font-mono text-slate-500">
                    Crater #{i + 101}
                  </div>
                ))}
              </div>
              <div className="text-[10px] font-mono text-slate-500 text-right">
                Solar Elevation: 42.1°
              </div>
            </div>
          </div>

          {/* Registered Target Image (Overlaid with clip-path) */}
          <div
            className="absolute inset-0 bg-slate-950 flex items-center justify-center transition-all duration-75"
            style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
          >
            <div className="relative w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black p-8 flex flex-col justify-between border-r-2 border-sky-400">
              <div className="px-3 py-1 rounded bg-sky-950/80 border border-sky-600/40 text-[10px] font-mono text-emerald-400 w-max">
                REGISTERED: Chandrayaan-2 OHRC (0.25m GSD)
              </div>
              <div className="grid grid-cols-6 gap-4 opacity-70">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="h-12 border border-sky-500/30 bg-sky-500/5 rounded flex items-center justify-center text-[10px] font-mono text-sky-300">
                    Aligned #{i + 101}
                  </div>
                ))}
              </div>
              <div className="text-[10px] font-mono text-emerald-400 text-left flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> RMSE: 0.42 px (Sub-pixel Accurate)
              </div>
            </div>
          </div>

          {/* Slider Control Handle */}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
          />

          {/* Visual Divider Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-sky-400 pointer-events-none z-20 shadow-[0_0_12px_rgba(56,189,248,0.8)]"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-lg border border-white/20">
              <Sliders className="w-3.5 h-3.5 rotate-90" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
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
