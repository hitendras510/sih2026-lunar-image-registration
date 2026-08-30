import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  r: number;
  a: number;
  s: number;
  tw: number;
  ts: number;
}

interface ShootingStar {
  x: number;
  y: number;
  len: number;
  v: number;
  a: number;
}

export const StarfieldCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let stars: Star[] = [];
    let shoots: ShootingStar[] = [];

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(220, Math.floor(window.innerWidth / 6));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.15 + 0.2,
        a: 0.2 + Math.random() * 0.7,
        s: 0.02 + Math.random() * 0.16,
        tw: Math.random() * Math.PI * 2,
        ts: 0.008 + Math.random() * 0.02,
      }));
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (const s of stars) {
        s.y += s.s;
        s.tw += s.ts;
        if (s.y > window.innerHeight + 2) s.y = -2;
        const alpha = s.a * (0.62 + 0.38 * Math.sin(s.tw));
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillStyle = '#bde8ff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (Math.random() < 0.004 && shoots.length < 2) {
        shoots.push({
          x: Math.random() * window.innerWidth * 0.8 + window.innerWidth * 0.1,
          y: Math.random() * window.innerHeight * 0.3,
          len: 0,
          v: 11 + Math.random() * 7,
          a: 1,
        });
      }

      for (let i = shoots.length - 1; i >= 0; i--) {
        const sh = shoots[i];
        sh.len += sh.v;
        sh.a -= 0.02;
        if (sh.a <= 0) {
          shoots.splice(i, 1);
          continue;
        }
        const grad = ctx.createLinearGradient(sh.x, sh.y, sh.x - sh.len, sh.y + sh.len * 0.36);
        grad.addColorStop(0, `rgba(190, 235, 255, ${sh.a * 0.9})`);
        grad.addColorStop(1, 'rgba(190, 235, 255, 0)');
        ctx.globalAlpha = 1;
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(sh.x, sh.y);
        ctx.lineTo(sh.x - sh.len, sh.y + sh.len * 0.36);
        ctx.stroke();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} id="stars" />;
};
