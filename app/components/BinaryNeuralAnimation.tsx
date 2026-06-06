'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { BRAND_RGB } from '@/app/lib/brand-colors';

type Variant = 'hero' | 'page';

type Node = { x: number; y: number; pulse: number; speed: number };

type Column = { x: number; y: number; speed: number; chars: string[] };

type AnimationConfig = {
  columnDivisor: number;
  nodeCount: (width: number) => number;
  opacityScale: number;
  speedScale: number;
  connectionDist: number;
  vignetteStrength: number;
};

const VARIANT_CONFIG: Record<Variant, AnimationConfig> = {
  hero: {
    columnDivisor: 24,
    nodeCount: (w) => (w < 640 ? 8 : 12),
    opacityScale: 1,
    speedScale: 1,
    connectionDist: 0.42,
    vignetteStrength: 1,
  },
  page: {
    columnDivisor: 26,
    nodeCount: (w) => (w < 640 ? 8 : 12),
    opacityScale: 0.92,
    speedScale: 0.85,
    connectionDist: 0.5,
    vignetteStrength: 0.22,
  },
};

function seedColumns(width: number, count: number): Column[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * -200,
    speed: 0.5 + Math.random() * 1.2,
    chars: Array.from({ length: 14 + Math.floor(Math.random() * 10) }, () =>
      Math.random() > 0.5 ? '1' : '0',
    ),
  }));
}

function seedNodes(width: number, height: number, count: number): Node[] {
  return Array.from({ length: count }, () => ({
    x: 0.08 * width + Math.random() * width * 0.84,
    y: 0.1 * height + Math.random() * height * 0.8,
    pulse: Math.random() * Math.PI * 2,
    speed: 0.02 + Math.random() * 0.03,
  }));
}

export default function BinaryNeuralAnimation({ variant = 'hero' }: { variant?: Variant }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotion();
  const config = VARIANT_CONFIG[variant];
  const isPage = variant === 'page';

  useEffect(() => {
    if (reduceMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId = 0;
    let columns: Column[] = [];
    let nodes: Node[] = [];
    let width = 0;
    let height = 0;
    let dpr = 1;

    const measure = () => {
      if (isPage) {
        width = window.innerWidth;
        height = window.innerHeight;
        return true;
      }

      const parent = canvas.parentElement;
      if (!parent) return false;
      width = parent.clientWidth;
      height = parent.clientHeight;
      return true;
    };

    const resize = () => {
      if (!measure()) return;

      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const columnCount = Math.max(12, Math.floor(width / config.columnDivisor));
      columns = seedColumns(width, columnCount).map((col) => ({
        ...col,
        speed: col.speed * config.speedScale,
      }));
      nodes = seedNodes(width, height, config.nodeCount(width)).map((node) => ({
        ...node,
        speed: node.speed * config.speedScale,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const opacity = config.opacityScale;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist > width * config.connectionDist) continue;

          const pulse = (Math.sin(a.pulse) + Math.sin(b.pulse)) * 0.5 + 0.5;
          ctx.strokeStyle = `rgba(${BRAND_RGB}, ${(0.1 + pulse * 0.2) * opacity})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      nodes.forEach((node) => {
        node.pulse += node.speed;
        const glow = (Math.sin(node.pulse) + 1) * 0.5;

        ctx.beginPath();
        ctx.arc(node.x, node.y, 3 + glow * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(138, 43, 226, ${(0.1 + glow * 0.18) * opacity})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x, node.y, 1.5 + glow, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${BRAND_RGB}, ${(0.4 + glow * 0.55) * opacity})`;
        ctx.fill();
      });

      ctx.font = '13px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      columns.forEach((col) => {
        col.y += col.speed;
        if (col.y > height + col.chars.length * 16) {
          col.y = -col.chars.length * 16;
          col.x = Math.random() * width;
          col.chars = col.chars.map(() => (Math.random() > 0.5 ? '1' : '0'));
        }

        col.chars.forEach((char, index) => {
          const y = col.y + index * 16;
          if (y < -16 || y > height + 16) return;

          const head = index === col.chars.length - 1;
          const fade = 1 - index / col.chars.length;

          ctx.fillStyle = head
            ? `rgba(${BRAND_RGB}, ${0.85 * opacity})`
            : `rgba(${BRAND_RGB}, ${(0.1 + fade * 0.3) * opacity})`;
          ctx.fillText(char, col.x, y);
        });
      });

      const vignette = ctx.createRadialGradient(
        width / 2,
        height / 2,
        height * 0.1,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.75,
      );
      const v = config.vignetteStrength;
      vignette.addColorStop(0, 'rgba(10, 11, 30, 0)');
      vignette.addColorStop(0.6, `rgba(10, 11, 30, ${0.18 * v})`);
      vignette.addColorStop(1, `rgba(10, 11, 30, ${0.6 * v})`);
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      animationId = requestAnimationFrame(draw);
    };

    resize();
    draw();

    const observer = !isPage && canvas.parentElement
      ? new ResizeObserver(resize)
      : null;
    observer?.observe(canvas.parentElement!);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationId);
      observer?.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, [reduceMotion, variant]);

  return (
    <div
      aria-hidden
      className={`pointer-events-none overflow-hidden ${
        isPage ? 'fixed inset-0 z-0' : 'absolute inset-0'
      }`}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {isPage && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,_rgba(36,27,255,0.14)_0%,_transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_100%,_rgba(139,92,246,0.1)_0%,_transparent_50%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0b1e]/10 via-[#0a0b1e]/20 to-[#0a0b1e]/45" />
        </>
      )}
    </div>
  );
}
