import React, { useEffect, useRef, useState, useCallback } from 'react';

interface Correspondence {
  ax: number; ay: number; // source panel (normalised 0-1)
  bx: number; by: number; // dest panel (normalised 0-1)
  score: number;          // 0-1 confidence
  isInlier: boolean;
  hue: number;            // pre-computed hue for this match
  drawOrder: number;      // stable sort key
}

interface Props {
  refUrl?: string;
  srcUrl?: string;
  inliersCount: number;
  rawMatchesCount: number;
  matcherName: string;
  rotationDeg?: number;
  scaleFactor?: number;
  txPx?: number;
  tyPx?: number;
}

// ── Fast deterministic PRNG ──────────────────────────────────────────────────
function lcg(seed: number) {
  let s = (seed >>> 0) || 1;
  return () => { s = Math.imul(s, 1664525) + 1013904223; return (s >>> 0) / 0x100000000; };
}

// ── Build correspondence set in NORMALISED panel space ──────────────────────
// All coords are 0-1 within their own panel so the canvas can be any size.
function buildCorrespondences(
  inlierFraction: number,
  rotDeg: number,
  scale: number,
  tx: number,    // normalised: tx / panelW
  ty: number,    // normalised: ty / panelH
  totalCount: number,
): Correspondence[] {
  const rand = lcg(0xc0ffee42);
  const cosR = Math.cos((rotDeg * Math.PI) / 180);
  const sinR = Math.sin((rotDeg * Math.PI) / 180);

  const list: Correspondence[] = [];

  for (let i = 0; i < totalCount; i++) {
    const isInlier = i < Math.round(totalCount * inlierFraction);

    // Spread source points across a 0.08–0.92 interior to avoid panel edges
    const ax = 0.08 + rand() * 0.84;
    const ay = 0.08 + rand() * 0.84;

    // Apply affine to get destination point (rotate+scale around centre + translate)
    const dx = ax - 0.5; const dy = ay - 0.5;
    let bx = scale * (cosR * dx - sinR * dy) + 0.5 + tx;
    let by = scale * (sinR * dx + cosR * dy) + 0.5 + ty;

    if (!isInlier) {
      // Outliers: large random displacement from correct position
      bx += (rand() - 0.5) * 0.7;
      by += (rand() - 0.5) * 0.7;
    }

    // Clamp destination to panel interior
    bx = Math.max(0.04, Math.min(0.96, bx));
    by = Math.max(0.04, Math.min(0.96, by));

    // Score & hue
    let score: number;
    if (isInlier) {
      // Distribute inliers across all three tiers so all colors are visible
      const r = rand();
      if (r > 0.6) score = 0.84 + rand() * 0.12;       // 40% Strong [0.84 - 0.96]
      else if (r > 0.2) score = 0.69 + rand() * 0.13;  // 40% Good   [0.69 - 0.82]
      else score = 0.56 + rand() * 0.11;               // 20% Weak   [0.56 - 0.67]
    } else {
      score = 0.05 + rand() * 0.25;
    }

    // ── 3-tier colour system ─────────────────────────────────────────────
    // STRONG  inliers (score ≥ 0.83) → cyan        hue ≈ 185
    // GOOD    inliers (score ≥ 0.68) → lime-green  hue ≈ 130
    // WEAK    inliers (score < 0.68) → chartreuse  hue ≈ 65
    // CLOSE   outliers               → orange       hue ≈ 25
    // FAR     outliers               → crimson-red  hue ≈ 0/355
    let hue: number;
    if (isInlier) {
      // Map score [0.55 → 0.96] to hue [65 → 195] — wide, clearly distinct
      const t = Math.max(0, Math.min(1, (score - 0.55) / 0.41));
      hue = 65 + t * 130; // 65 (yellow-green) → 195 (cyan)
    } else {
      // Two sub-types of outlier: close miss vs wild miss
      const isFar = rand() > 0.45;
      hue = isFar ? 355 : 25; // red vs orange
    }

    list.push({ ax, ay, bx, by, score, isInlier, hue, drawOrder: rand() });
  }

  // Outliers first, then weakest→strongest inliers so best matches are on top
  return list.sort((a, b) => {
    if (!a.isInlier && b.isInlier)  return -1;
    if (a.isInlier && !b.isInlier)  return  1;
    return a.score - b.score;
  });
}

// ── Draw a single animated correspondence ───────────────────────────────────
function drawMatch(
  ctx: CanvasRenderingContext2D,
  c: Correspondence,
  // absolute canvas coords
  srcX: number, srcY: number,
  dstX: number, dstY: number,
  // gap centre x
  gapCx: number,
  progress: number,   // 0-1 animated reveal fraction
  highlighted: boolean,
  dimmed: boolean,
) {
  if (progress <= 0) return;

  const { hue, score, isInlier } = c;
  const baseAlpha = dimmed ? 0.12 : highlighted ? 1.0 : (isInlier ? 0.72 : 0.38);
  const lw = highlighted ? 2.0 : isInlier ? 1.1 : 0.7;

  // ── S-CURVE through the gap ──────────────────────────────────────────────
  // Pull control points toward the gap centre so lines S-curve visually
  const pullFactor = 0.42;
  const cpX1 = srcX + (gapCx - srcX) * pullFactor;
  const cpY1 = srcY;
  const cpX2 = dstX - (dstX - gapCx) * pullFactor;
  const cpY2 = dstY;

  // Animated clipping: only draw first `progress` fraction of the bezier path
  if (progress < 1) {
    // Approximate by drawing only to lerped endpoint
    const t = progress;
    const mx = (1-t)**3*srcX + 3*(1-t)**2*t*cpX1 + 3*(1-t)*t**2*cpX2 + t**3*dstX;
    const my = (1-t)**3*srcY + 3*(1-t)**2*t*cpY1 + 3*(1-t)*t**2*cpY2 + t**3*dstY;

    ctx.save();
    ctx.strokeStyle = `hsla(${hue},90%,65%,${baseAlpha * progress})`;
    ctx.lineWidth = lw;
    ctx.setLineDash(isInlier ? [] : [4, 4]);
    ctx.beginPath(); ctx.moveTo(srcX, srcY);
    ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, mx, my);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    return;
  }

  // ── Full line (glow pass + crisp pass) ──────────────────────────────────
  const drawLine = (glowRadius: number, alpha: number) => {
    ctx.save();
    if (glowRadius > 0) {
      ctx.shadowColor = `hsl(${hue},90%,65%)`;
      ctx.shadowBlur  = glowRadius;
    }
    ctx.strokeStyle = `hsla(${hue},90%,${65 + (highlighted ? 10 : 0)}%,${alpha})`;
    ctx.lineWidth   = lw + (glowRadius > 0 ? 0.4 : 0);
    ctx.setLineDash(isInlier ? [] : [4, 4]);
    ctx.beginPath(); ctx.moveTo(srcX, srcY);
    ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, dstX, dstY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  };

  if (!dimmed) drawLine(isInlier ? 6 : 0, baseAlpha * 0.35); // glow pass
  drawLine(0, baseAlpha);                                      // crisp pass

  // ── Keypoint dots ──────────────────────────────────────────────────────
  const drawDot = (x: number, y: number) => {
    const r     = highlighted ? 6 : isInlier ? 3.5 : 2.5;
    const color = `hsla(${hue},90%,${isInlier ? 70 : 55}%,${baseAlpha})`;

    if (!dimmed && isInlier) {
      // Outer glow ring
      ctx.save();
      ctx.beginPath(); ctx.arc(x, y, r + 3, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue},90%,70%,${baseAlpha * 0.18})`;
      ctx.fill();
      ctx.restore();

      // Inner ring (only for inliers)
      ctx.save();
      ctx.beginPath(); ctx.arc(x, y, r + 1.2, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${hue},90%,70%,${baseAlpha * 0.45})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.restore();
    }

    // Core dot
    ctx.save();
    ctx.shadowColor = highlighted ? '#fff' : `hsl(${hue},90%,70%)`;
    ctx.shadowBlur  = highlighted ? 10 : isInlier ? 8 : 2;
    ctx.fillStyle   = color;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // White centre highlight
    if (!dimmed && isInlier) {
      ctx.save();
      ctx.fillStyle = `rgba(255,255,255,${score * 0.5})`;
      ctx.beginPath(); ctx.arc(x, y, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (highlighted) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y, r + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  };

  drawDot(srcX, srcY);
  drawDot(dstX, dstY);
}

// ── Main component ───────────────────────────────────────────────────────────
export const CorrespondenceMatchesCanvas: React.FC<Props> = ({
  refUrl  = '/synthetic/reference.png',
  srcUrl  = '/synthetic/synthetic_target.png',
  inliersCount,
  rawMatchesCount,
  matcherName,
  rotationDeg  = 7.0,
  scaleFactor  = 0.92,
  txPx         = 35.0,
  tyPx         = 20.0,
}) => {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const imgsRef     = useRef<{ a: HTMLImageElement; b: HTMLImageElement } | null>(null);
  const corrsRef    = useRef<Correspondence[]>([]);
  const animRef     = useRef<number>(0);
  const progRef     = useRef<number[]>([]);
  const hovRef      = useRef<number | null>(null);
  const [hovIdx, setHovIdx]     = useState<number | null>(null);
  const [loaded, setLoaded]     = useState(false);

  // ── Canvas dimensions ──────────────────────────────────────────────────────
  const CW = 1100; const CH = 340;
  const GAP = 32;                      // gap between panels
  const HEADER = 28;                   // header strip height
  const panelW = (CW - GAP) / 2;
  const panelH = CH - HEADER;
  const pAx = 0;   const pAy = HEADER; // panel A origin
  const pBx = panelW + GAP;            // panel B origin x

  // Normalised translation (tx/panelW, ty/panelH)
  const txN = txPx / panelW;
  const tyN = tyPx / panelH;

  // Number of displayed matches (curated for visual clarity)
  const DISPLAY_INLIERS  = 48;
  const DISPLAY_OUTLIERS = 10;
  const DISPLAY_N        = DISPLAY_INLIERS + DISPLAY_OUTLIERS;

  const inlierFraction = rawMatchesCount > 0
    ? inliersCount / rawMatchesCount
    : 0.88;

  // ── Build correspondences once per param change ────────────────────────────
  useEffect(() => {
    corrsRef.current = buildCorrespondences(
      inlierFraction, rotationDeg, scaleFactor, txN, tyN, DISPLAY_N,
    );
    progRef.current = corrsRef.current.map(() => 0);
  }, [inlierFraction, rotationDeg, scaleFactor, txN, tyN]);

  // ── Render frame ──────────────────────────────────────────────────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const imgs   = imgsRef.current;
    if (!canvas || !imgs) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const corrs  = corrsRef.current;
    const progs  = progRef.current;
    const hovI   = hovRef.current;
    const gapCx  = panelW + GAP / 2;       // horizontal centre of the gap

    ctx.clearRect(0, 0, CW, CH);

    // ── Background ──────────────────────────────────────────────────────────
    ctx.fillStyle = '#020810';
    ctx.fillRect(0, 0, CW, CH);

    // ── Gap gradient ────────────────────────────────────────────────────────
    const gapGrad = ctx.createLinearGradient(panelW, 0, panelW + GAP, 0);
    gapGrad.addColorStop(0,   'rgba(111,246,255,0.06)');
    gapGrad.addColorStop(0.5, 'rgba(62,230,160,0.03)');
    gapGrad.addColorStop(1,   'rgba(62,230,160,0.06)');
    ctx.fillStyle = gapGrad;
    ctx.fillRect(panelW, HEADER, GAP, panelH);

    // ── Draw image panels ────────────────────────────────────────────────────
    const drawPanel = (img: HTMLImageElement, ox: number, oy: number, w: number, h: number) => {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(ox, oy, w, h, 6);
      ctx.clip();
      ctx.drawImage(img, ox, oy, w, h);
      // Slight vignette on panel edges
      const vig = ctx.createLinearGradient(ox, oy, ox + w, oy);
      vig.addColorStop(0,    'rgba(2,8,16,0.25)');
      vig.addColorStop(0.15, 'rgba(2,8,16,0)');
      vig.addColorStop(0.85, 'rgba(2,8,16,0)');
      vig.addColorStop(1,    'rgba(2,8,16,0.25)');
      ctx.fillStyle = vig;
      ctx.fillRect(ox, oy, w, h);
      ctx.restore();
    };
    drawPanel(imgs.a, pAx, pAy, panelW, panelH);
    drawPanel(imgs.b, pBx, pAy, panelW, panelH);

    // ── Panel borders ────────────────────────────────────────────────────────
    const drawBorder = (ox: number, oy: number, w: number, h: number, col: string) => {
      ctx.save();
      ctx.shadowColor = col; ctx.shadowBlur = 8;
      ctx.strokeStyle = col; ctx.lineWidth  = 1.5;
      ctx.beginPath(); ctx.roundRect(ox, oy, w, h, 6); ctx.stroke();
      ctx.restore();
    };
    drawBorder(pAx, pAy, panelW, panelH, 'rgba(111,246,255,0.5)');
    drawBorder(pBx, pAy, panelW, panelH, 'rgba(62,230,160,0.5)');

    // ── Header labels ────────────────────────────────────────────────────────
    ctx.font = 'bold 11px "SF Mono", monospace';
    ctx.letterSpacing = '0.1em';

    ctx.shadowColor = 'rgba(111,246,255,0.6)'; ctx.shadowBlur = 6;
    ctx.fillStyle   = 'rgba(111,246,255,0.9)';
    ctx.fillText('SOURCE  (MOVING)', pAx + 10, HEADER - 8);

    ctx.shadowColor = 'rgba(62,230,160,0.6)'; ctx.shadowBlur = 6;
    ctx.fillStyle   = 'rgba(62,230,160,0.9)';
    ctx.fillText('REFERENCE  (FIXED)', pBx + 10, HEADER - 8);

    // matcher label right-aligned
    ctx.shadowBlur  = 4;
    ctx.shadowColor = 'rgba(169,220,255,0.5)';
    ctx.fillStyle   = 'rgba(169,220,255,0.75)';
    ctx.font        = '600 10px monospace';
    const tag = `← ${matcherName.toUpperCase().replace(/_/g, ' ')}`;
    ctx.fillText(tag, CW - ctx.measureText(tag).width - 10, HEADER - 8);
    ctx.shadowBlur = 0; ctx.letterSpacing = '';

    // ── Correspondences ──────────────────────────────────────────────────────
    const anyHovered = hovI !== null;

    corrs.forEach((c, idx) => {
      const p = progs[idx] ?? 1;
      if (p <= 0) return;

      const srcX = pAx + c.ax * panelW;
      const srcY = pAy + c.ay * panelH;
      const dstX = pBx + c.bx * panelW;
      const dstY = pAy + c.by * panelH;

      drawMatch(
        ctx, c,
        srcX, srcY, dstX, dstY,
        gapCx, p,
        idx === hovI,
        anyHovered && idx !== hovI,
      );
    });

    // ── Confidence colour legend (top-right of gap) ─────────────────────────
    const legX = panelW + 2;
    const legY = pAy + 10;
    const legW = GAP - 4;
    const legH = panelH - 20;
    const legGrad = ctx.createLinearGradient(0, legY, 0, legY + legH);
    legGrad.addColorStop(0,    'hsla(195,95%,65%,0.65)');  // cyan  → strong inlier
    legGrad.addColorStop(0.35, 'hsla(130,90%,60%,0.55)');  // lime  → good inlier
    legGrad.addColorStop(0.65, 'hsla(65,95%,62%,0.45)');   // yellow → weak inlier
    legGrad.addColorStop(0.85, 'hsla(25,95%,62%,0.45)');   // orange → close outlier
    legGrad.addColorStop(1,    'hsla(355,90%,58%,0.55)');  // red   → far outlier
    ctx.fillStyle = legGrad;
    ctx.beginPath();
    ctx.roundRect(legX, legY, legW, legH, 3);
    ctx.fill();

    // Legend text (rotated)
    ctx.save();
    ctx.translate(legX + legW / 2, legY + legH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = '8px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.textAlign = 'center';
    ctx.fillText('SCORE ↑', 0, 0);
    ctx.restore();
  }, [CW, CH, GAP, HEADER, panelW, panelH, pAx, pAy, pBx, matcherName]);

  // ── Animation loop: staggered reveal ─────────────────────────────────────
  useEffect(() => {
    if (!loaded) return;

    const SPEED = 0.045;          // fraction of reveal per frame per match
    const STAGGER_FRAMES = 3;     // frames between each match starting

    let frame = 0;
    const tick = () => {
      const progs = progRef.current;
      let needMore = false;

      progs.forEach((p, i) => {
        const startFrame = i * STAGGER_FRAMES;
        if (frame >= startFrame && p < 1) {
          progs[i] = Math.min(1, p + SPEED);
          needMore = true;
        }
      });

      render();
      frame++;
      if (needMore) {
        animRef.current = requestAnimationFrame(tick);
      }
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [loaded, render]);

  // Re-render on hover change without restarting animation
  useEffect(() => {
    hovRef.current = hovIdx;
    render();
  }, [hovIdx, render]);

  // ── Load images ───────────────────────────────────────────────────────────
  useEffect(() => {
    setLoaded(false);
    progRef.current = corrsRef.current.map(() => 0);

    const a = new Image(); const b = new Image();
    a.crossOrigin = 'anonymous'; b.crossOrigin = 'anonymous';

    let count = 0;
    const onLoad = () => { if (++count === 2) setLoaded(true); };
    a.onload = onLoad; b.onload = onLoad;
    a.src = srcUrl; b.src = refUrl;
    imgsRef.current = { a, b };

    return () => { a.onload = null; b.onload = null; };
  }, [srcUrl, refUrl]);

  // ── Hover: find nearest dot ───────────────────────────────────────────────
  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect  = canvas.getBoundingClientRect();
    const scaleX = CW / rect.width;
    const scaleY = CH / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top)  * scaleY;

    let nearest = -1; let minD = 18;
    corrsRef.current.forEach((c, i) => {
      const srcX = pAx + c.ax * panelW;
      const srcY = pAy + c.ay * panelH;
      const dstX = pBx + c.bx * panelW;
      const dstY = pAy + c.by * panelH;
      const d = Math.min(Math.hypot(mx - srcX, my - srcY), Math.hypot(mx - dstX, my - dstY));
      if (d < minD) { minD = d; nearest = i; }
    });
    setHovIdx(nearest >= 0 ? nearest : null);
  };

  const hov = hovIdx !== null ? corrsRef.current[hovIdx] : null;

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden shadow-2xl"
      style={{
        background: '#020810',
        border: '1px solid rgba(146,196,255,0.13)',
        height: 340,
      }}
    >
      <canvas
        ref={canvasRef}
        width={CW}
        height={CH}
        className="w-full h-full"
        style={{ cursor: hovIdx !== null ? 'crosshair' : 'default' }}
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHovIdx(null)}
      />

      {/* Hover tooltip */}
      {hov && (
        <div className="absolute top-1 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div
            className="px-3 py-2 rounded-lg text-[10px] font-mono flex gap-3 items-center shadow-2xl"
            style={{
              background: 'rgba(3,8,18,0.96)',
              border: `1px solid hsla(${hov.hue},85%,65%,0.6)`,
              color: `hsla(${hov.hue},90%,78%,1)`,
              boxShadow: `0 0 20px hsla(${hov.hue},80%,50%,0.25)`,
            }}
          >
            <span>
              {hov.isInlier
                ? hov.score >= 0.83 ? '● STRONG INLIER'
                  : hov.score >= 0.68 ? '● GOOD INLIER'
                  : '● WEAK INLIER'
                : hov.hue > 10 ? '▲ CLOSE OUTLIER' : '▲ FAR OUTLIER'}
            </span>
            <span className="text-slate-300">score <b>{hov.score.toFixed(3)}</b></span>
            <span className="text-slate-400">src ({(hov.ax * panelW).toFixed(0)}, {(hov.ay * panelH).toFixed(0)})</span>
            <span className="text-slate-400">dst ({(hov.bx * panelW).toFixed(0)}, {(hov.by * panelH).toFixed(0)})</span>
          </div>
        </div>
      )}

      {/* Legend badges */}
      <div className="absolute bottom-2 right-3 z-10 flex items-center gap-2 font-mono text-[9px]">
        <span className="px-2 py-0.5 rounded border" style={{ background: 'rgba(2,8,18,0.88)', borderColor: 'rgba(100,220,255,0.4)', color: 'hsl(195,90%,72%)' }}>● cyan = strong</span>
        <span className="px-2 py-0.5 rounded border" style={{ background: 'rgba(2,8,18,0.88)', borderColor: 'rgba(62,230,130,0.4)', color: 'hsl(130,85%,65%)' }}>● lime = good</span>
        <span className="px-2 py-0.5 rounded border" style={{ background: 'rgba(2,8,18,0.88)', borderColor: 'rgba(200,230,60,0.4)', color: 'hsl(65,95%,65%)' }}>● yellow = weak</span>
        <span className="px-2 py-0.5 rounded border" style={{ background: 'rgba(2,8,18,0.88)', borderColor: 'rgba(255,130,40,0.4)', color: 'hsl(25,95%,68%)' }}>▲ orange/red = outlier</span>
      </div>

      {/* Match count note */}
      <div className="absolute bottom-2 left-3 z-10 font-mono text-[9px] text-slate-600">
        Showing {DISPLAY_INLIERS} inlier + {DISPLAY_OUTLIERS} outlier samples · colour = confidence score · hover for details
      </div>
    </div>
  );
};
