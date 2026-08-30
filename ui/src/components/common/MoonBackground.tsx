import React, { useEffect, useRef } from 'react';
import { useScroll, useMotionValueEvent } from 'framer-motion';

interface MoonBackgroundProps {
  frameCount?: number;
  basePath?: string;
}

export const MoonBackground: React.FC<MoonBackgroundProps> = ({
  frameCount = 150,
  basePath = '/sequence',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const prefersReducedMotionRef = useRef<boolean>(false);

  // Framer Motion global document scroll progress
  const { scrollYProgress } = useScroll();

  // Helper to format frame path (supports 3-digit e.g. frame_000_delay-0.067s.webp)
  const getFrameUrl = (index: number) => {
    const pad3 = String(index).padStart(3, '0');
    return `${basePath}/frame_${pad3}_delay-0.067s.webp`;
  };

  // Draw frame to canvas efficiently without React re-renders
  const drawFrame = (frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const idx = Math.max(0, Math.min(frameCount - 1, frameIndex));
    const img = imagesRef.current[idx];

    if (!img || !img.complete || img.naturalWidth === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // Calculate aspect-ratio object-fit cover/contain for centered Moon
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = width / height;

    let drawWidth = width;
    let drawHeight = height;
    let offsetX = 0;
    let offsetY = 0;

    // Use contain-style centering so the full Moon sphere is visible and cinematic
    if (canvasRatio > imgRatio) {
      drawHeight = height * 0.92;
      drawWidth = drawHeight * imgRatio;
      offsetX = (width - drawWidth) / 2;
      offsetY = (height - drawHeight) / 2 + height * 0.05;
    } else {
      drawWidth = width * 0.92;
      drawHeight = drawWidth / imgRatio;
      offsetX = (width - drawWidth) / 2;
      offsetY = (height - drawHeight) / 2 + height * 0.05;
    }

    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  };

  // Schedule draw using requestAnimationFrame
  const requestDraw = (frameIndex: number) => {
    if (prefersReducedMotionRef.current) {
      drawFrame(0);
      return;
    }
    currentFrameRef.current = frameIndex;
    if (rafIdRef.current !== null) return;

    rafIdRef.current = requestAnimationFrame(() => {
      drawFrame(currentFrameRef.current);
      rafIdRef.current = null;
    });
  };

  // Preload frames once on mount
  useEffect(() => {
    // Check reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotionRef.current = mediaQuery.matches;

    const loadedImages: HTMLImageElement[] = [];

    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      img.src = getFrameUrl(i);
      if (i === 0) {
        img.onload = () => {
          drawFrame(0);
        };
      }
      loadedImages.push(img);
    }

    imagesRef.current = loadedImages;

    const handleResize = () => {
      requestDraw(currentFrameRef.current);
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [frameCount, basePath]);

  // Subscribe to Framer Motion scroll changes without React state
  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const targetFrame = Math.round(latest * (frameCount - 1));
    if (targetFrame !== currentFrameRef.current) {
      requestDraw(targetFrame);
    }
  });

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100dvh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
};
