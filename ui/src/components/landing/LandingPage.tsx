/**
 * LandingPage — faithful React translation of selene-match-standalone.html
 *
 * Sections (matching the standalone HTML):
 *  1. StarfieldCanvas  — fixed canvas background
 *  2. Noise overlay    — fixed SVG noise texture
 *  3. BootPreloader    — splash screen (3 s fade-out)
 *  4. TopNav           — fixed navigation bar
 *  5. Moon             — parallax moon image
 *  6. Hero             — "ALIGN THE MOON"
 *  7. Stats band
 *  8. Mission section
 *  9. Workflow section
 * 10. Technology section
 * 11. Results section
 * 12. Team section
 * 13. CTA / Workbench section
 * 14. Footer
 * 15. AiAssistant orb
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import './landing.css';

/* ─── tiny helpers ─────────────────────────────────────────────────────── */
const Eyebrow: React.FC<{ num: string; label: string }> = ({ num, label }) => (
  <div className="sl-eyebrow">
    <b>{num}</b> {label}
  </div>
);

/* ─── Starfield canvas ─────────────────────────────────────────────────── */
const Starfield: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    type Star = { x: number; y: number; r: number; a: number; s: number };
    let stars: Star[] = [];
    let rafId: number;

    const resize = () => {
      canvas.width = innerWidth * devicePixelRatio;
      canvas.height = innerHeight * devicePixelRatio;
      canvas.style.width = innerWidth + 'px';
      canvas.style.height = innerHeight + 'px';
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      stars = Array.from({ length: 220 }, () => ({
        x: Math.random() * innerWidth,
        y: Math.random() * innerHeight,
        r: Math.random() * 1.3,
        a: 0.2 + Math.random() * 0.7,
        s: 0.03 + Math.random() * 0.18,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (const s of stars) {
        s.y += s.s;
        if (s.y > innerHeight) s.y = 0;
        ctx.globalAlpha = s.a;
        ctx.fillStyle = '#bde8ff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      rafId = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="sl-stars" />;
};

/* ─── Splash / Boot preloader ──────────────────────────────────────────── */
const Splash: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    let n = 0;
    const timer = setInterval(() => {
      n = Math.min(100, n + 1);
      setProgress(n);
      if (n === 100) clearInterval(timer);
    }, 28);
    const fadeTimer = setTimeout(() => setFading(true), 3000);
    const doneTimer = setTimeout(onDone, 3800);
    return () => {
      clearInterval(timer);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div className={`sl-splash${fading ? ' sl-splash--out' : ''}`}>
      <div className="sl-splash-rings" />
      <div className="sl-splash-inner">
        <div className="sl-hero-label">ISRO · LUNAR REGISTRATION · 2026</div>
        <div className="sl-splash-welcome">WELCOME TO</div>
        <div className="sl-splash-title">
          SELENE<em>-MATCH</em>
        </div>
        <div className="sl-splash-progress">
          <div className="sl-progress">
            <i style={{ width: `${progress}%` }} />
          </div>
          SELENE-MATCH
          <div className="sl-progress">
            <i style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="sl-online">SYSTEM ONLINE · MISSION READY</div>
      </div>
    </div>
  );
};

/* ─── Top navigation ───────────────────────────────────────────────────── */
const TopNav: React.FC<{ activeSection: string; onWorkbench: () => void }> = ({
  activeSection,
  onWorkbench,
}) => {
  const links = ['home', 'about', 'workflow', 'technology', 'results', 'team'];
  const labels: Record<string, string> = {
    home: 'HOME',
    about: 'MISSION',
    workflow: 'WORKFLOW',
    technology: 'TECHNOLOGY',
    results: 'RESULTS',
    team: 'TEAM',
  };

  return (
    <nav className="sl-nav">
      <a className="sl-brand" href="#home">
        <span className="sl-brand-icon" />
        <span>
          SELENE<span className="sl-cyan">-MATCH</span>
        </span>
      </a>
      <div className="sl-navlinks">
        {links.map((id) => (
          <a
            key={id}
            href={`#${id}`}
            className={activeSection === id ? 'active' : ''}
          >
            {labels[id]}
          </a>
        ))}
      </div>
      <button className="sl-button sl-nav-workbench" onClick={onWorkbench}>
        OPEN WORKBENCH ↗
      </button>
    </nav>
  );
};

/* ─── Moon parallax ────────────────────────────────────────────────────── */
const Moon: React.FC = () => {
  const moonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!moonRef.current) return;
      moonRef.current.style.marginLeft = (e.clientX / innerWidth - 0.5) * 12 + 'px';
      moonRef.current.style.marginTop = (e.clientY / innerHeight - 0.5) * 12 + 'px';
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  return (
    <div className="sl-moon" ref={moonRef}>
      <div className="sl-moon-surface" />
    </div>
  );
};

/* ─── Reveal hook (IntersectionObserver) ───────────────────────────────── */
const useReveal = (ready: boolean) => {
  useEffect(() => {
    if (!ready) return;

    const checkScroll = () => {
      const els = document.querySelectorAll('.sl-reveal, .reveal');
      const windowHeight = window.innerHeight;
      els.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < windowHeight * 0.92) {
          el.classList.add('sl-show');
          el.classList.add('show');
        }
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('sl-show');
            e.target.classList.add('show');
          }
        });
      },
      { threshold: 0.02, rootMargin: '0px 0px 100px 0px' },
    );

    // Initial check after paint
    const timer = setTimeout(() => {
      const els = document.querySelectorAll('.sl-reveal, .reveal');
      els.forEach((el) => observer.observe(el));
      checkScroll();
    }, 50);

    window.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [ready]);
};

/* ─── AI Assistant orb ─────────────────────────────────────────────────── */
const AiAssistant: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const ask = () => {
    const q = question.trim().toLowerCase();
    if (!q) return;
    let a =
      'SELENE-MATCH aligns lunar images from different sensors using GSD equalization, illumination preparation, gated matching, robust geometry and sub-pixel refinement.';
    if (q.includes('rmse')) a = 'RMSE measures remaining geometric error. The target is below 1 pixel.';
    else if (q.includes('magsac')) a = 'MAGSAC++ robustly estimates the transformation while rejecting false correspondences.';
    else if (q.includes('matcher')) a = 'The gate selects LightGlue, SIFT, Crater Graph, Mutual Information or Phase Correlation based on scene conditions.';
    else if (q.includes('pipeline')) a = 'S0 Ingest → S1 GSD → S2 Illumination → S3 Gate → S4 Match → S5 MAGSAC++ → S6 IC-LK → S7 Warp → S8 Product.';
    setAnswer(a);
    setQuestion('');
  };

  return (
    <div className="sl-assistant">
      {open && (
        <div className="sl-chat">
          <h4>
            <span className="sl-cyan">●</span> SELENE-MATCH AI
          </h4>
          <p>Ask about the pipeline, matchers, metrics or registration workflow.</p>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && ask()}
            placeholder="Ask about SELENE-MATCH..."
          />
          {answer && <div className="sl-chat-answer">{answer}</div>}
        </div>
      )}
      <button className="sl-orb" onClick={() => setOpen((o) => !o)} aria-label="Open AI">
        ✦
      </button>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
export const LandingPage: React.FC = () => {
  const { openWorkbench } = useApp();
  const [ready, setReady] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const handleDone = useCallback(() => setReady(true), []);

  // Track active nav section via IntersectionObserver
  useEffect(() => {
    if (!ready) return;
    const sections = document.querySelectorAll('section[id]');
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveSection(e.target.id);
        }),
      { threshold: 0.4 },
    );
    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, [ready]);

  useReveal(ready);

  return (
    <>
      {/* Fixed background layers */}
      <Starfield />
      <div className="sl-noise" />

      {/* Boot splash */}
      <Splash onDone={handleDone} />

      {/* Main content — shown after splash */}
      {ready && (
        <>
          <TopNav activeSection={activeSection} onWorkbench={() => openWorkbench('upload')} />
          <Moon />

          <main className="sl-main">
            {/* ── HERO ── */}
            <section id="home" className="sl-hero">
              <div className="sl-hero-grid" />
              <div className="sl-hero-copy">
                <div className="sl-hero-label">ISRO · LUNAR IMAGE REGISTRATION · 2026</div>
                <h1>
                  ALIGN<span className="sl-stroke">THE MOON.</span>
                </h1>
                <p>
                  <b style={{ color: '#f8fafc' }}>SELENE-MATCH</b> aligns
                  Chandrayaan-2 OHRC, TMC-2 and IIRS imagery with LRO NAC/WAC reference
                  data — across radically different resolution, illumination, and terrain
                  conditions.
                </p>
                <div className="sl-actions">
                  <button className="sl-button sl-primary" onClick={() => openWorkbench('upload')}>
                    START REGISTRATION ↗
                  </button>
                  <a href="#workflow" className="sl-button sl-secondary">
                    EXPLORE SYSTEM ↓
                  </a>
                </div>
                <div className="sl-status">
                  <span>
                    MISSION STATUS <b style={{ color: 'var(--sl-green)' }}>● ONLINE</b>
                  </span>
                  <span>
                    MODE <b style={{ color: 'var(--sl-blue)' }}>AUTOMATIC</b>
                  </span>
                  <span>
                    GSD RANGE <b style={{ color: '#cbd5e1' }}>0.25m — 80m</b>
                  </span>
                </div>
              </div>
              <div className="sl-scroll">SCROLL</div>
            </section>

            {/* ── STATS BAND ── */}
            <div className="sl-stats sl-reveal">
              {[
                { val: '320×', label: 'MAX GSD DIFFERENCE', color: 'var(--sl-cyan)' },
                { val: '<1 px', label: 'TARGET RMSE', color: 'var(--sl-green)' },
                { val: '9', label: 'PIPELINE STAGES', color: 'var(--sl-orange)' },
                { val: '8×8', label: 'GCP GRID', color: 'var(--sl-purple)' },
              ].map(({ val, label, color }) => (
                <div className="sl-stat" key={label} style={{ color }}>
                  <strong>{val}</strong>
                  <small>{label}</small>
                </div>
              ))}
            </div>

            {/* ── MISSION ── */}
            <section id="about" className="sl-wrap sl-about">
              <div className="sl-mission sl-reveal">
                <div>
                  <Eyebrow num="01" label="THE MISSION" />
                  <h2 className="sl-section-title">
                    One surface.
                    <br />
                    <span className="sl-outline-blue">Many views.</span>
                  </h2>
                  <p className="sl-copy">
                    Lunar images from different sensors do not naturally line up. Each instrument
                    captures the same terrain at wildly different resolutions, under different sun
                    angles, from different orbital positions.
                  </p>
                  <p className="sl-copy">
                    SELENE-MATCH creates a reliable, measurable correspondence between them —
                    producing a scientifically validated registered product suitable for geospatial
                    analysis.
                  </p>
                </div>
                <div className="sl-info-grid">
                  {[
                    { key: 'SOURCE', val: 'Chandrayaan-2 OHRC · TMC-2 · IIRS', c: 'var(--sl-blue)' },
                    { key: 'REFERENCE', val: 'LRO NAC · LRO WAC', c: 'var(--sl-cyan)' },
                    { key: 'FORMAT', val: 'PDS3 · GeoTIFF · Level-2', c: 'var(--sl-green)' },
                    { key: 'OUTPUT', val: 'Registered TIFF + Validation Report', c: 'var(--sl-orange)' },
                  ].map(({ key, val, c }) => (
                    <div className="sl-card" key={key}>
                      <div className="sl-key" style={{ color: c }}>{key}</div>
                      <div className="sl-detail">{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── WORKFLOW ── */}
            <section id="workflow" className="sl-wrap">
              <div className="sl-center sl-reveal">
                <Eyebrow num="02" label="HOW IT WORKS" />
                <h2 className="sl-section-title">
                  From pixels
                  <br />
                  to precision.
                </h2>
                <p className="sl-copy sl-intro">
                  A nine-stage pipeline that progressively removes scale, illumination, and
                  geometric differences before sub-pixel refinement.
                </p>
              </div>
              <div className="sl-workflow sl-reveal">
                {[
                  {
                    stage: 'S0 — S2',
                    num: '01',
                    color: 'var(--sl-blue)',
                    title: 'INGEST + PREPARE',
                    desc: 'Read PDS/GeoTIFF metadata, equalize GSD, normalize imagery and build illumination-robust representations.',
                  },
                  {
                    stage: 'S3 — S4',
                    num: '02',
                    color: 'var(--sl-cyan)',
                    title: 'CHOOSE + MATCH',
                    desc: 'Automatic gate selects the appropriate matcher based on scene conditions, then generates candidate correspondences.',
                  },
                  {
                    stage: 'S5 — S6',
                    num: '03',
                    color: 'var(--sl-green)',
                    title: 'FILTER + REFINE',
                    desc: 'MAGSAC++ removes false matches. IC-LK refines validated control points toward sub-pixel precision.',
                  },
                  {
                    stage: 'S7 — S8',
                    num: '04',
                    color: 'var(--sl-orange)',
                    title: 'ALIGN + PROVE',
                    desc: 'Uniform GCPs drive the final warp. RMSE, CE90, NNI, and coverage metrics validate the result.',
                  },
                ].map(({ stage, num, color, title, desc }) => (
                  <article className="sl-card" key={num}>
                    <div className="sl-stage" style={{ color }}>
                      {stage} <b>{num}</b>
                    </div>
                    <div className="sl-bar" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                    <h3>{title}</h3>
                    <p>{desc}</p>
                  </article>
                ))}
              </div>
            </section>

            {/* ── TECHNOLOGY ── */}
            <section id="technology" className="sl-wrap">
              <div className="sl-tech-head sl-reveal">
                <div>
                  <Eyebrow num="03" label="TECHNOLOGY" />
                  <h2 className="sl-section-title">
                    A specialist
                    <br />
                    for every problem.
                  </h2>
                </div>
                <p className="sl-copy">
                  Instead of one algorithm for every case, SELENE-MATCH uses a gated ensemble
                  strategy selecting the most suitable technique from scene conditions.
                </p>
              </div>
              <div className="sl-duo sl-reveal">
                <article className="sl-card">
                  <div className="sl-bar" style={{ background: 'var(--sl-blue)', boxShadow: '0 0 8px var(--sl-blue)' }} />
                  <h3>Computer Vision Core</h3>
                  <p>
                    Illumination preparation, feature extraction, correspondence estimation, robust
                    geometric filtering, and sub-pixel refinement operating as one unified
                    registration pipeline.
                  </p>
                  <div className="sl-tags">
                    {['OpenCV', 'Rasterio', 'GDAL', 'NumPy', 'PyTorch', 'Kornia', 'MAGSAC++', 'IC-LK'].map(
                      (t) => (
                        <span className="sl-tag" key={t}>{t}</span>
                      ),
                    )}
                  </div>
                </article>
                <article className="sl-card">
                  <div className="sl-bar" style={{ background: 'var(--sl-cyan)', boxShadow: '0 0 8px var(--sl-cyan)' }} />
                  <h3>Matcher Ensemble</h3>
                  <p>
                    LightGlue, SIFT, Phase Correlation, Mutual Information, Dense Matching, and the
                    Crater Graph strategy are routed according to sensor modality and illumination
                    conditions.
                  </p>
                  <div className="sl-tags">
                    {['LIGHTGLUE', 'SIFT', 'CRATER GRAPH', 'PHASE CORRELATION', 'MUTUAL INFORMATION', 'ROMA'].map(
                      (t) => (
                        <span className="sl-tag" key={t}>{t}</span>
                      ),
                    )}
                  </div>
                </article>
              </div>
              <div className="sl-stack sl-card sl-reveal">
                <div className="sl-stack-title">FULL TECHNOLOGY STACK</div>
                <div className="sl-stack-items">
                  {['OpenCV', 'PyTorch', 'Kornia', 'GDAL', 'Rasterio', 'NumPy', 'MAGSAC++', 'IC-LK', 'LightGlue', 'SIFT', 'FastAPI', 'React'].map(
                    (t) => (
                      <span key={t}>{t}</span>
                    ),
                  )}
                </div>
              </div>
            </section>

            {/* ── RESULTS ── */}
            <section id="results" className="sl-wrap">
              <div className="sl-center sl-reveal">
                <Eyebrow num="04" label="THE RESULT" />
                <h2 className="sl-section-title">
                  Don't just
                  <br />
                  <span className="sl-outline-green">look aligned.</span>
                </h2>
                <p className="sl-copy sl-intro">
                  Every registration is backed by measurable evidence and visual diagnostics.
                </p>
              </div>
              <div className="sl-metric-grid sl-reveal">
                {[
                  { val: 'RMSE', label: 'GEOMETRIC ERROR', sub: 'Sub-pixel target', color: 'var(--sl-cyan)' },
                  { val: 'CE90', label: '90% ERROR RADIUS', sub: 'Circular coverage', color: 'var(--sl-green)' },
                  { val: 'NNI', label: 'GCP UNIFORMITY', sub: 'Nearest-neighbor', color: 'var(--sl-orange)' },
                  { val: '8×8', label: 'GRID COVERAGE', sub: '64 control points', color: 'var(--sl-purple)' },
                ].map(({ val, label, sub, color }) => (
                  <div className="sl-metric" key={val} style={{ color }}>
                    <strong>{val}</strong>
                    <small>{label}</small>
                    <span>{sub}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── TEAM ── */}
            <section id="team" className="sl-wrap">
              <div className="sl-reveal">
                <Eyebrow num="05" label="THE TEAM" />
                <h2 className="sl-section-title">
                  Built by
                  <br />
                  <span className="sl-outline-purple">explorers.</span>
                </h2>
              </div>
              <div className="sl-team sl-reveal">
                {[
                  { num: '01', role: 'Mission Lead', desc: 'System Architecture & Pipeline Design' },
                  { num: '02', role: 'CV Engineer', desc: 'Feature Matching & Robust Geometry' },
                  { num: '03', role: 'Remote Sensing', desc: 'PDS/GeoTIFF Processing & GSD Equalization' },
                  { num: '04', role: 'Backend Dev', desc: 'FastAPI Workbench & API Infrastructure' },
                  { num: '05', role: 'Frontend Dev', desc: 'React Visualization & UI/UX' },
                  { num: '06', role: 'Research', desc: 'Crater Graph Strategy & Illumination Models' },
                ].map(({ num, role, desc }) => (
                  <article className="sl-card sl-member" key={num}>
                    <div className="sl-number">{num}</div>
                    <h3>{role}</h3>
                    <p>{desc}</p>
                  </article>
                ))}
              </div>
            </section>

            {/* ── CTA / WORKBENCH ── */}
            <section id="workbench" className="sl-wrap">
              <div className="sl-cta sl-card sl-reveal">
                <div>
                  <Eyebrow num="06" label="THE WORKBENCH" />
                  <h2 className="sl-section-title">
                    Ready to register
                    <br />
                    <span className="sl-cyan">the Moon?</span>
                  </h2>
                  <p className="sl-copy">
                    Upload source and reference imagery, inspect metadata, run the full S0–S8
                    pipeline, compare the registration overlay and download final products from the
                    SELENE-MATCH Workbench.
                  </p>
                  <div className="sl-actions sl-actions--left">
                    <button
                      className="sl-button sl-primary"
                      onClick={() => openWorkbench('upload')}
                    >
                      ENTER WORKBENCH ↗
                    </button>
                    <a
                      href="https://github.com/hitendras510/sih2026-lunar-image-registration"
                      target="_blank"
                      rel="noreferrer"
                      className="sl-button sl-secondary"
                    >
                      VIEW SOURCE ↗
                    </a>
                  </div>
                </div>
                <div className="sl-data">
                  PROJECT TYPE <i>/</i> <b>LUNAR CV</b>
                  <br />
                  INPUT <i>/</i> <b>PDS · GEOTIFF</b>
                  <br />
                  OUTPUT <i>/</i> <b>REGISTERED TIFF</b>
                  <br />
                  API <i>/</i> <b>FASTAPI</b>
                  <br />
                  UI <i>/</i> <b>REACT · VITE</b>
                  <br />
                  YEAR <i>/</i> <b>2026</b>
                </div>
              </div>
            </section>
          </main>

          {/* ── FOOTER ── */}
          <footer className="sl-footer">
            <div>
              <div className="sl-footer-brand">
                SELENE<span className="sl-cyan">-MATCH</span>
              </div>
              <span className="sl-footer-label">LUNAR IMAGE REGISTRATION SYSTEM</span>
            </div>
            <div className="sl-footer-center">
              <small>
                CHANDRAYAAN-2 × LRO
                <br />
                OPEN-SOURCE · RESEARCH WORKBENCH
              </small>
            </div>
            <div className="sl-footer-right">
              <small>
                © 2026 TEAM SELENE-MATCH
                <br />
                PRESENTED TO TECHSTARS
              </small>
            </div>
          </footer>

          {/* ── AI ASSISTANT ── */}
          <AiAssistant />
        </>
      )}
    </>
  );
};
