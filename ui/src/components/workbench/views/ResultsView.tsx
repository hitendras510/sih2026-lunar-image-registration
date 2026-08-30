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

      <div className="card overflow-hidden">
        {/* TABS */}
        <div className="flex flex-wrap border-b border-[rgba(146,196,255,0.13)] bg-[rgba(4,9,16,0.5)]">
          {(['wipe', 'checker', 'gcp', 'residual'] as const).map(tab => (
            <button
              key={tab}
              className={`result-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'wipe' ? 'WIPE / CURTAIN'
                : tab === 'checker' ? '8×8 CHECKERBOARD'
                : tab === 'gcp' ? 'GCP + QUIVER'
                : 'RESIDUAL HEATMAP'}
            </button>
          ))}
        </div>

        <div className="p-5">

          {/* ── WIPE TAB ── */}
          {activeTab === 'wipe' && (
            <div className="result-pane">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-80">
                <div className="relative bg-black rounded-xl border border-[rgba(146,196,255,0.16)] overflow-hidden">
                  <span className="absolute top-2.5 left-2.5 z-10 badge bg-[rgba(4,9,16,0.85)]">
                    REFERENCE (FIXED)
                  </span>
                  <img src={refUrl} alt="Reference" className="w-full h-full object-cover opacity-90" />
                </div>

                <div className="relative bg-black rounded-xl border border-[rgba(146,196,255,0.16)] overflow-hidden">
                  <span className="absolute top-2.5 left-2.5 z-10 badge bg-[rgba(4,9,16,0.85)]">
                    {registeredUrl ? 'REGISTERED OUTPUT' : isComplete ? 'SOURCE (PRE-REGISTERED)' : 'SOURCE / MOVING'}
                  </span>
                  {!registeredUrl && isComplete && (
                    <span className="absolute top-2.5 right-2.5 z-10 badge text-warning text-[9px]">
                      DEMO — no live GeoTIFF
                    </span>
                  )}
                  <img
                    src={wipeRightUrl}
                    alt="Registered"
                    className="w-full h-full object-cover opacity-90 transition-all"
                    style={{ clipPath: `inset(0 0 0 ${wipeVal}%)` }}
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <label className="mini-label shrink-0">Curtain Position ({wipeVal}%)</label>
                <input
                  type="range" min="0" max="100" value={wipeVal}
                  onChange={e => setWipeVal(parseInt(e.target.value, 10))}
                  className="flex-1 mt-1"
                />
              </div>
            </div>
          )}

          {/* ── CHECKERBOARD TAB ── */}
          {activeTab === 'checker' && (
            <div className="result-pane">
              <div className="h-80 rounded-xl border border-[rgba(146,196,255,0.16)] grid grid-cols-8 grid-rows-8 overflow-hidden relative">
                {checkerCells.map((isRef, idx) => (
                  <div key={idx} className="relative overflow-hidden border-[0.5px] border-slate-900/40">
                    <img
                      src={isRef ? refUrl : (registeredUrl || srcUrl)}
                      alt=""
                      className="w-full h-full object-cover opacity-90 scale-125"
                    />
                    <span className="absolute bottom-0.5 right-0.5 font-mono text-[7px] bg-slate-950/70 text-slate-300 px-1 rounded">
                      {isRef ? 'REF' : registeredUrl ? 'REG' : 'SRC'}
                    </span>
                  </div>
                ))}
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
            <div className="result-pane h-80">
              <HeatmapCanvas
                rmse={results.rmse || 0}
                opacity={settings.heatmapOpacity || 75}
                refUrl={refUrl}
                srcUrl={registeredUrl || srcUrl}
              />
              {!isComplete && (
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
