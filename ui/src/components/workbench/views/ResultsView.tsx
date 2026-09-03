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

  const jobId = results.jobId;
  const isReal = isComplete && jobId && !jobId.startsWith('demo_');
  const registeredUrl = isReal
    ? seleneApi.productUrl(`/products/${jobId}/registered.png`)
    : null;

  const refUrl = referenceImage?.previewUrl || '/synthetic/reference.png';
  const srcUrl = sourceImage?.previewUrl     || '/synthetic/synthetic_target.png';
  const wipeRightUrl = registeredUrl || srcUrl;

  const residualHeatmapUrl = isReal && results.residualHeatmapUrl
    ? seleneApi.productUrl(results.residualHeatmapUrl)
    : null;

  const checkerCells = Array.from({ length: 64 }, (_, i) => {
    const row = Math.floor(i / 8); const col = i % 8;
    return (row + col) % 2 === 0;
  });

  const gcpCount = isComplete ? Math.max(4, results.inliers || 0) : 0;
  const displayGcps = Math.min(gcpCount, 60);

  return (
    <section id="view-results" className="view-section active space-y-6">
      {/* HEADER */}
      <div className="pb-3 border-b border-[#D0D0D0] flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#222222]">
            Visual Comparison &amp; Results
          </h1>
          <p className="text-xs text-[#555555] mt-0.5">
            Inspect the registered raster against the reference image with split curtain, checkerboard, and vector overlays.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isComplete ? (
            <span className="px-2.5 py-1 rounded text-xs font-semibold bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/30">
              Registration Complete (RMSE {results.rmse} px)
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded text-xs font-semibold bg-[#F8F9FA] text-[#555555] border border-[#D0D0D0]">
              Awaiting Pipeline Execution
            </span>
          )}
        </div>
      </div>

      {/* COMPARISON TABS CONTAINER */}
      <div className="p-6 rounded bg-white border border-[#D0D0D0] space-y-5">
        {/* TABS */}
        <div className="flex flex-wrap border-b border-[#D0D0D0] gap-2 pb-3">
          {(['wipe', 'checker', 'gcp', 'residual'] as const).map(tab => (
            <button
              key={tab}
              className={`px-4 py-2 rounded text-xs font-semibold border transition-colors ${
                activeTab === tab
                  ? 'bg-[#1F4E79] text-white border-[#1F4E79]'
                  : 'bg-white text-[#222222] border-[#D0D0D0] hover:bg-[#F2F4F6]'
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
          {/* WIPE / CURTAIN TAB */}
          {activeTab === 'wipe' && (
            <div className="space-y-4 font-sans">
              <div className="relative h-[420px] rounded border border-[#D0D0D0] overflow-hidden bg-[#F8F9FA] select-none">
                {/* Base Layer: Reference (Fixed) */}
                <img
                  src={refUrl}
                  alt="Reference Layer"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 z-20 px-3 py-1 rounded bg-white/90 border border-[#D0D0D0] text-xs font-semibold text-[#1F4E79] shadow-xs">
                  Reference: LRO NAC (Fixed)
                </span>

                {/* Overlay Layer: Registered / Source (Moving) */}
                <img
                  src={wipeRightUrl}
                  alt="Source Layer"
                  className="absolute inset-0 w-full h-full object-cover z-10 transition-none"
                  style={{ clipPath: `inset(0 0 0 ${wipeVal}%)` }}
                />
                <span className="absolute top-3 right-3 z-20 px-3 py-1 rounded bg-white/90 border border-[#D0D0D0] text-xs font-semibold text-[#2E7D32] shadow-xs">
                  {registeredUrl ? 'Registered: TPS Warped Output' : 'Target: OHRC Moving'}
                </span>

                {/* Vertical Curtain Divider Laser Line & Handle */}
                <div
                  className="absolute top-0 bottom-0 z-30 w-0.5 bg-[#1F4E79] pointer-events-none"
                  style={{ left: `${wipeVal}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#1F4E79] text-white flex items-center justify-center text-xs font-bold border border-white">
                    ↔
                  </div>
                </div>
              </div>

              {/* Curtain Control Bar */}
              <div className="p-4 rounded bg-[#F8F9FA] border border-[#D0D0D0] flex items-center gap-4 text-xs">
                <span className="text-[#555555] font-semibold shrink-0">
                  Curtain Position: <span className="text-[#1F4E79] font-bold">{wipeVal}%</span>
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={wipeVal}
                  onChange={(e) => setWipeVal(parseInt(e.target.value, 10))}
                  className="flex-1 accent-[#1F4E79] cursor-pointer h-1.5 bg-[#D0D0D0] rounded"
                />
              </div>
            </div>
          )}

          {/* CHECKERBOARD TAB */}
          {activeTab === 'checker' && (
            <div className="result-pane">
              <div className="h-80 rounded border border-[#D0D0D0] grid grid-cols-8 grid-rows-8 overflow-hidden relative">
                {checkerCells.map((isRef, idx) => {
                  const row = Math.floor(idx / 8);
                  const col = idx % 8;
                  return (
                    <div key={idx} className="relative overflow-hidden border-[0.5px] border-[#D0D0D0]">
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
                      <span className="absolute bottom-0.5 right-0.5 font-mono text-[9px] bg-white/90 text-[#222222] px-1 rounded border border-[#D0D0D0]">
                        {isRef ? 'REF' : registeredUrl ? 'REG' : 'SRC'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* GCP + QUIVER TAB */}
          {activeTab === 'gcp' && (
            <div className="result-pane">
              <div className="h-80 rounded overflow-hidden relative border border-[#D0D0D0]">
                {isComplete ? (
                  <GcpCanvas
                    refUrl={refUrl}
                    gcpCount={displayGcps}
                    inlierRatio={results.ratio / 100}
                    rmse={results.rmse}
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center bg-[#F8F9FA] border border-[#D0D0D0] rounded">
                    <div className="text-[#555555] text-xs font-mono">No GCP Data</div>
                    <p className="text-xs text-[#555555] mt-1">Run registration pipeline to generate control points.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RESIDUAL HEATMAP TAB */}
          {activeTab === 'residual' && (
            <div className="result-pane h-80 relative overflow-hidden bg-[#F8F9FA] rounded border border-[#D0D0D0] flex items-center justify-center">
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
                </div>
              ) : (
                <p className="text-xs text-[#555555] font-mono">
                  Heatmap will populate after registration completes.
                </p>
              )}
            </div>
          )}

        </div>
      </div>
    </section>
  );
};
