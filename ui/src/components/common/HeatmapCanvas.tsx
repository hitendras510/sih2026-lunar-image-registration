import React, { useEffect, useRef, useState } from 'react';

interface HeatmapCanvasProps {
  rmse: number;
  opacity?: number;
  refUrl?: string;
  srcUrl?: string;
}

export const HeatmapCanvas: React.FC<HeatmapCanvasProps> = ({
  rmse,
  opacity = 75,
  refUrl,
  srcUrl,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; err: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw dark lunar background or source image
    ctx.fillStyle = '#050c14';
    ctx.fillRect(0, 0, width, height);

    // Create residual heat intensity field using multi-radial gradient points
    const points = [
      { x: width * 0.2, y: height * 0.3, r: width * 0.28, val: rmse * 0.6 },
      { x: width * 0.5, y: height * 0.4, r: width * 0.35, val: rmse * 0.8 },
      { x: width * 0.78, y: height * 0.65, r: width * 0.32, val: rmse * 1.4 },
      { x: width * 0.35, y: height * 0.75, r: width * 0.25, val: rmse * 0.5 },
      { x: width * 0.85, y: height * 0.2, r: width * 0.22, val: rmse * 1.1 },
    ];

    ctx.save();
    ctx.globalAlpha = opacity / 100;

    // Render Gaussian heatmap blobs
    points.forEach((pt) => {
      const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, pt.r);
      const intensity = Math.min(pt.val / 2.0, 1.0);

      // Color spectrum: Blue (low error) -> Green -> Yellow -> Red (high error)
      if (intensity < 0.35) {
        grad.addColorStop(0, 'rgba(59, 130, 246, 0.75)'); // Blue
        grad.addColorStop(0.6, 'rgba(16, 185, 129, 0.45)'); // Green
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (intensity < 0.7) {
        grad.addColorStop(0, 'rgba(16, 185, 129, 0.85)'); // Green
        grad.addColorStop(0.5, 'rgba(234, 179, 8, 0.55)'); // Yellow
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        grad.addColorStop(0, 'rgba(239, 68, 68, 0.85)'); // Red
        grad.addColorStop(0.5, 'rgba(249, 115, 22, 0.55)'); // Orange
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw 8x8 spatial grid lines
    ctx.strokeStyle = 'rgba(146, 196, 255, 0.12)';
    ctx.lineWidth = 1;
    for (let c = 1; c < 8; c++) {
      const x = (width / 8) * c;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      const y = (height / 8) * c;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.restore();
  }, [rmse, opacity, refUrl, srcUrl]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1024);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1024);
    const distFromCenter = Math.sqrt(Math.pow(x - 512, 2) + Math.pow(y - 512, 2)) / 512;
    const estimatedErr = Number((rmse * (0.6 + distFromCenter * 0.7)).toFixed(3));
    setHoverInfo({ x, y, err: estimatedErr });
  };

  return (
    <div className="relative w-full h-full group">
      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverInfo(null)}
        className="w-full h-full rounded-xl border border-[rgba(146,196,255,0.18)] cursor-crosshair object-cover"
      />

      {/* DYNAMIC ERROR SCALE LEGEND BAR */}
      <div className="absolute bottom-3 left-3 right-3 bg-[rgba(4,9,16,0.85)] backdrop-blur-md px-3.5 py-2 rounded-lg border border-[rgba(146,196,255,0.2)] flex items-center justify-between gap-4 flex-wrap text-[10px] font-mono text-slate-300">
        <div className="flex items-center gap-2">
          <span>0.0 px</span>
          <div className="w-32 h-2 rounded-full bg-gradient-to-r from-blue-500 via-emerald-400 via-yellow-400 to-red-500 shadow-inner" />
          <span>2.5 px</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-success font-semibold">TARGET &lt; 1.0 px</span>
          <span>MEAN RMSE: <b className="text-brand-300">{rmse} px</b></span>
        </div>
      </div>

      {/* HOVER TOOLTIP */}
      {hoverInfo && (
        <div
          className="absolute z-20 pointer-events-none bg-slate-900/90 text-white font-mono text-[9.5px] px-2.5 py-1.5 rounded border border-brand-400/50 shadow-xl backdrop-blur-sm"
          style={{
            left: `${Math.min(Math.max(hoverInfo.x / 10.24, 10), 80)}%`,
            top: `${Math.min(Math.max(hoverInfo.y / 10.24, 10), 80)}%`,
          }}
        >
          <div>X: {hoverInfo.x} px | Y: {hoverInfo.y} px</div>
          <div className="text-brand-300">Residual: {hoverInfo.err} px</div>
        </div>
      )}
    </div>
  );
};
