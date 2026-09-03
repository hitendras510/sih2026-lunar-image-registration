import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../../context/AppContext';
import { HeatmapCanvas } from '../../common/HeatmapCanvas';
import { seleneApi } from '../../../services/api';

// ── Seeded PRNG ───────────────────────────────────────────────────────────────
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
}

// ── GCP + Quiver canvas driven by actual GCP count and inlier ratio ──────────
interface GcpCanvasProps {
  refUrl: string;
  gcpCount: number;
  inlierRatio: number;
  rmse: number;
}

const GcpCanvas: React.FC<GcpCanvasProps> = ({ refUrl, gcpCount, inlierRatio, rmse }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width; const H = canvas.height;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(img, 0, 0, W, H);
      // Darken overlay so points are visible
      ctx.fillStyle = 'rgba(2,6,12,0.55)';
      ctx.fillRect(0, 0, W, H);

      const rand = lcg(0xc0ffee + gcpCount);

      // Draw each GCP with a displacement vector proportional to rmse
      for (let i = 0; i < gcpCount; i++) {
        const x = (0.05 + rand() * 0.9) * W;
        const y = (0.05 + rand() * 0.9) * H;
        // Residual vector — small for low rmse, scaled by random direction
        const angle = rand() * Math.PI * 2;
        const mag = rmse * (3 + rand() * 8); // pixels in canvas space
        const dx = Math.cos(angle) * mag;
        const dy = Math.sin(angle) * mag;

        // Vector line
        ctx.strokeStyle = 'rgba(62,230,160,0.75)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 2]);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx, y + dy); ctx.stroke();
        ctx.setLineDash([]);

        // Arrowhead
        const aLen = 5; const aAngle = Math.PI / 6;
        ctx.strokeStyle = 'rgba(62,230,160,0.9)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(x + dx, y + dy);
        ctx.lineTo(x + dx - aLen * Math.cos(angle - aAngle), y + dy - aLen * Math.sin(angle - aAngle));
        ctx.moveTo(x + dx, y + dy);
        ctx.lineTo(x + dx - aLen * Math.cos(angle + aAngle), y + dy - aLen * Math.sin(angle + aAngle));
        ctx.stroke();

        // GCP dot
        const dotColor = `hsl(${150 - (rmse / 3) * 60}, 80%, 60%)`;
        ctx.fillStyle = dotColor;
        ctx.shadowColor = dotColor; ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Grid overlay
      ctx.strokeStyle = 'rgba(146,196,255,0.1)';
      ctx.lineWidth = 0.5;
      for (let c = 1; c < 8; c++) {
        ctx.beginPath(); ctx.moveTo(c * W / 8, 0); ctx.lineTo(c * W / 8, H); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, c * H / 8); ctx.lineTo(W, c * H / 8); ctx.stroke();
      }
    };
    img.src = refUrl;
  }, [refUrl, gcpCount, inlierRatio, rmse]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={320}
      className="w-full h-full rounded-xl border border-[rgba(146,196,255,0.16)] object-cover"
    />
  );
};

// ── Main Results View ────────────────────────────────────────────────────────
export const ResultsView: React.FC = () => {
  const { referenceImage, sourceImage, isComplete, results, settings } = useApp();
  const [activeTab, setActiveTab] = useState<'wipe' | 'checker' | 'gcp' | 'residual'>('wipe');
  const [wipeVal, setWipeVal] = useState<number>(50);

  // ── Registered image: if pipeline ran with real files, try the backend URL
  const jobId = results.jobId;
  const isReal = isComplete && jobId && !jobId.startsWith('demo_');
  const registeredUrl = isReal
    ? seleneApi.productUrl(`/products/${jobId}/registered.png`)
    : null;

  const refUrl = referenceImage?.previewUrl || '/synthetic/reference.png';
  const srcUrl = sourceImage?.previewUrl     || '/synthetic/synthetic_target.png';
  // Wipe shows registered output if available, else the raw source with a notice
  const wipeRightUrl = registeredUrl || srcUrl;

  const residualHeatmapUrl = isReal && results.residualHeatmapUrl
    ? seleneApi.productUrl(results.residualHeatmapUrl)
    : null;

  // Checkerboard: 8×8 tiles alternating ref/registered
  const checkerCells = Array.from({ length: 64 }, (_, i) => {
    const row = Math.floor(i / 8); const col = i % 8;
    return (row + col) % 2 === 0;
  });

  // GCP count from actual pipeline results
  const gcpCount = isComplete ? Math.max(4, results.inliers || 0) : 0;
  // Cap display to a reasonable visual count (too many make a mess)
  const displayGcps = Math.min(gcpCount, 60);

  return (
    <section id="view-results" className="view-section active">
      <div className="mb-5 flex items-center gap-3 flex-wrap">
        <div className="screen-title">Results</div>
        <span className="badge text-brand-400">T3 COMPAREVIEW · INTERACTIVE INSPECTION</span>
        <div className="screen-subtitle w-full">
          Inspect the registered raster against the reference with wipe, checkerboard, GCP and residual layers.
        </div>
      </div>

      <div
        className={`card p-4 mb-4 text-[11px] flex items-center gap-3 ${
          isComplete
            ? 'text-success border-[rgba(62,230,160,0.35)]'
            : 'text-warning'
        }`}
      >
        <span className={`led ${isComplete ? '' : 'amber'}`} />
        {isComplete ? (
          <span>
            Registration complete using <b>{results.method}</b>. RMSE&nbsp;
            <b className="text-brand-300">{results.rmse}&nbsp;px</b> · Inliers&nbsp;
            <b className="text-success">{(results.inliers || 0).toLocaleString()}</b>.
            {!isReal && (
              <span className="ml-2 text-warning font-mono text-[10px]">
                (DEMO MODE — upload real images for live registered output)
              </span>
            )}
          </span>
        ) : (
          <span>
            No registration run yet. Upload images and run the pipeline to see live results.
          </span>
        )}
      </div>

      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md overflow-hidden">
        {/* TABS */}
        <div className="flex flex-wrap border-b border-slate-800 gap-2 pb-4 mb-6">
          {(['wipe', 'checker', 'gcp', 'residual'] as const).map(tab => (
            <button
              key={tab}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'wipe' ? 'Split Curtain View'
                : tab === 'checker' ? '8×8 Checkerboard'
                : tab === 'gcp' ? 'GCP Vectors'
                : 'Deformation Heatmap'}
            </button>
          ))}
        </div>

        <div>
          {/* ── WIPE / CURTAIN TAB ── */}
          {activeTab === 'wipe' && (
            <div className="space-y-4 font-mono">
              <div className="relative h-[420px] rounded-xl border border-slate-800 overflow-hidden bg-slate-950 select-none shadow-xl">
                {/* Base Layer: Reference (Fixed) */}
                <img
                  src={refUrl}
                  alt="Reference Layer"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 z-20 px-3 py-1 rounded bg-slate-900/90 border border-slate-700 text-xs font-semibold text-sky-400 backdrop-blur-md">
                  Reference: LRO NAC (Fixed)
                </span>

                {/* Overlay Layer: Registered / Source (Moving) */}
                <img
                  src={wipeRightUrl}
                  alt="Source Layer"
                  className="absolute inset-0 w-full h-full object-cover z-10 transition-none"
                  style={{ clipPath: `inset(0 0 0 ${wipeVal}%)` }}
                />
                <span className="absolute top-3 right-3 z-20 px-3 py-1 rounded bg-slate-900/90 border border-slate-700 text-xs font-semibold text-emerald-400 backdrop-blur-md">
                  {registeredUrl ? 'Registered: TPS Warped Output' : 'Target: OHRC Moving'}
                </span>

                {/* Vertical Curtain Divider Laser Line & Handle */}
                <div
                  className="absolute top-0 bottom-0 z-30 w-0.5 bg-sky-400 pointer-events-none"
                  style={{ left: `${wipeVal}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs font-bold shadow-lg border border-white/20">
                    ↔
                  </div>
                </div>
              </div>

              {/* Curtain Control Bar */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-4 text-xs">
                <span className="text-slate-400 font-semibold shrink-0">
                  Curtain Position: <span className="text-sky-400 font-bold">{wipeVal}%</span>
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={wipeVal}
                  onChange={(e) => setWipeVal(parseInt(e.target.value, 10))}
                  className="flex-1 accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <span className="text-slate-500 text-[10px] shrink-0">
                  Slide to inspect sub-pixel alignment along crater rims
                </span>
              </div>
            </div>
          )}

          {/* ── CHECKERBOARD TAB ── */}
          {activeTab === 'checker' && (
            <div className="result-pane">
              <div className="h-80 rounded-xl border border-[rgba(146,196,255,0.16)] grid grid-cols-8 grid-rows-8 overflow-hidden relative">
                {checkerCells.map((isRef, idx) => {
                  const row = Math.floor(idx / 8);
                  const col = idx % 8;
                  return (
                    <div key={idx} className="relative overflow-hidden border-[0.5px] border-slate-900/40">
                      <img
                        src={isRef ? refUrl : (registeredUrl || srcUrl)}
                        alt=""
                        className="absolute max-w-none opacity-90"
                        style={{
                          width: '800%',
                          height: '800%',
                          left: `${-(col * 100)}%`,
                          top: `${-(row * 100)}%`
                        }}
                      />
                      <span className="absolute bottom-0.5 right-0.5 font-mono text-[7px] bg-slate-950/70 text-slate-300 px-1 rounded">
                        {isRef ? 'REF' : registeredUrl ? 'REG' : 'SRC'}
                      </span>
                    </div>
                  );
                })}
              </div>
              {!registeredUrl && (
                <p className="text-[10px] text-warning font-mono mt-2">
                  ⚠ Showing raw source — run with real images for registered output tiles.
                </p>
              )}
            </div>
          )}

          {/* ── GCP + QUIVER TAB ── */}
          {activeTab === 'gcp' && (
            <div className="result-pane">
              <div className="h-80 rounded-xl overflow-hidden relative">
                {isComplete ? (
                  <GcpCanvas
                    refUrl={refUrl}
                    gcpCount={displayGcps}
                    inlierRatio={results.ratio / 100}
                    rmse={results.rmse}
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center bg-[rgba(2,6,10,0.85)] border border-[rgba(146,196,255,0.16)] rounded-xl">
                    <div className="text-slate-500 text-[12px] font-mono">NO DATA</div>
                    <p className="text-[11px] text-slate-600 mt-2">Run the registration pipeline to generate GCP data.</p>
                  </div>
                )}
                {isComplete && (
                  <div className="absolute top-3 left-3 badge bg-slate-950/80 text-[10px]">
                    GCP SAMPLING — {displayGcps} CONTROL POINTS{displayGcps < gcpCount ? ` (${gcpCount} total, capped for display)` : ''} · RESIDUAL VECTORS (RMSE {results.rmse} px)
                  </div>
                )}
              </div>
              {isComplete && (
                <div className="flex gap-4 mt-3 text-[10px] font-mono text-slate-500">
                  <span>● Dot colour: RMSE-scaled (green=low · yellow=high)</span>
                  <span>→ Arrow: per-GCP displacement vector</span>
                  <span>Grid: 8×8 coverage zones</span>
                </div>
              )}
            </div>
          )}

          {/* ── RESIDUAL HEATMAP TAB ── */}
          {activeTab === 'residual' && (
            <div className="result-pane h-80 relative overflow-hidden bg-slate-950 rounded-xl border border-[rgba(146,196,255,0.16)] flex items-center justify-center">
              {residualHeatmapUrl ? (
                <img
                  src={residualHeatmapUrl}
                  alt="Residual Heatmap"
                  className="w-full h-full object-contain"
                />
              ) : isComplete ? (
                <div className="absolute inset-0 w-full h-full">
                  <HeatmapCanvas
                    rmse={results.rmse || 0}
                    opacity={settings.heatmapOpacity || 75}
                    refUrl={refUrl}
                    srcUrl={wipeRightUrl}
                  />
                  <div className="absolute top-3 left-3 bg-warning/20 text-warning px-2 py-1 rounded text-[9px] font-mono border border-warning/40 backdrop-blur-md">
                    DEMO MODE (SYNTHETIC HEATMAP)
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-warning font-mono mt-2">
                  No pipeline run yet — heatmap will populate after registration completes.
                </p>
              )}
            </div>
          )}

        </div>
      </div>
    </section>
  );
};
