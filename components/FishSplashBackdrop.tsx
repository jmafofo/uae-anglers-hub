'use client';

import { useEffect, useRef } from 'react';

/**
 * FishSplashBackdrop — the signature animated backdrop.
 *
 * A calm band of layered water with drifting underwater shadows, and every
 * few seconds a fish bursts through the surface in an arc with a splash of
 * droplets and expanding ripples. Subtle by design: it should feel alive,
 * not demanding.
 *
 * Usage: place inside a `relative overflow-hidden` container, behind content.
 * Honors prefers-reduced-motion (renders one static frame), pauses when the
 * tab is hidden, and caps DPR at 2 for performance.
 */

type Tone = 'light' | 'dark';

interface Palette {
  waves: string[];
  fish: string;
  shadow: string;
  droplet: string;
  ripple: string;
}

const PALETTES: Record<Tone, Palette> = {
  light: {
    waves: ['rgba(69,169,155,0.10)', 'rgba(35,103,94,0.13)', 'rgba(23,78,71,0.16)'],
    fish: 'rgba(23,78,71,0.85)',
    shadow: 'rgba(23,78,71,0.10)',
    droplet: 'rgba(35,103,94,0.55)',
    ripple: 'rgba(35,103,94,0.35)',
  },
  dark: {
    waves: ['rgba(69,169,155,0.14)', 'rgba(0,201,167,0.10)', 'rgba(0,212,170,0.08)'],
    fish: 'rgba(169,224,214,0.85)',
    shadow: 'rgba(0,212,170,0.10)',
    droplet: 'rgba(169,224,214,0.6)',
    ripple: 'rgba(0,212,170,0.35)',
  },
};

interface FlyingFish {
  x0: number;      // launch x
  dir: 1 | -1;     // horizontal direction
  vx: number;      // px/s
  vy: number;      // px/s (negative = up)
  t: number;       // elapsed s
  size: number;    // body length px
  splashedIn: boolean;
}

interface Droplet { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; r: number }
interface Ripple { x: number; y: number; r: number; alpha: number }
interface ShadowFish { x: number; y: number; speed: number; size: number; dir: 1 | -1; wobble: number }

const GRAVITY = 2400; // px/s² — snappy, slightly cinematic

function drawFishShape(ctx: CanvasRenderingContext2D, size: number, angle: number, color: string) {
  // Stylized leaping-fish silhouette, nose pointing along +x before rotation.
  ctx.save();
  ctx.rotate(angle);
  ctx.fillStyle = color;
  const s = size;
  ctx.beginPath();
  // Body: pointed nose, curved back and belly tapering to the tail peduncle
  ctx.moveTo(s * 0.5, 0);
  ctx.bezierCurveTo(s * 0.28, -s * 0.22, -s * 0.05, -s * 0.20, -s * 0.28, -s * 0.04);
  ctx.bezierCurveTo(-s * 0.34, -s * 0.01, -s * 0.34, s * 0.01, -s * 0.28, s * 0.04);
  ctx.bezierCurveTo(-s * 0.05, s * 0.20, s * 0.28, s * 0.22, s * 0.5, 0);
  ctx.closePath();
  ctx.fill();
  // Tail flukes
  ctx.beginPath();
  ctx.moveTo(-s * 0.27, 0);
  ctx.lineTo(-s * 0.52, -s * 0.16);
  ctx.lineTo(-s * 0.44, 0);
  ctx.lineTo(-s * 0.52, s * 0.16);
  ctx.closePath();
  ctx.fill();
  // Dorsal fin
  ctx.beginPath();
  ctx.moveTo(s * 0.08, -s * 0.16);
  ctx.quadraticCurveTo(-s * 0.02, -s * 0.34, -s * 0.12, -s * 0.13);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export default function FishSplashBackdrop({
  tone = 'light',
  className = '',
  intensity = 1,
}: {
  tone?: Tone;
  className?: string;
  /** 0.5 = calmer (fewer leaps), 2 = livelier */
  intensity?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const palette = PALETTES[tone];
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let raf = 0;
    let last = performance.now();
    let running = true;

    const fish: FlyingFish[] = [];
    const droplets: Droplet[] = [];
    const ripples: Ripple[] = [];
    const shadows: ShadowFish[] = [];
    let nextLeapAt = 1.2 + Math.random() * 2;
    let clock = 0;

    // Feeding frenzy: a burst of activity in one zone — several fish
    // chasing bait to the surface in rapid succession, with spray and
    // churning "boil" rings. Fires every ~15–30s.
    let frenzy: { x: number; until: number; nextSpawn: number } | null = null;
    let nextFrenzyAt = 6 + Math.random() * 8;

    const waterline = () => height * 0.68;

    function resize() {
      if (!canvas || !canvas.parentElement) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.parentElement.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawnLeap(opts?: { x?: number; lunker?: boolean; frenzyFish?: boolean }) {
      const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
      const x0 = opts?.x ?? width * (0.15 + Math.random() * 0.7);
      const lunker = opts?.lunker ?? false;
      const frenzyFish = opts?.frenzyFish ?? false;
      const size = lunker ? 52 + Math.random() * 18 : frenzyFish ? 18 + Math.random() * 14 : 26 + Math.random() * 22;
      fish.push({
        x0,
        dir,
        vx: dir * (140 + Math.random() * 160) * (frenzyFish ? 1.25 : 1),
        vy: -(560 + Math.random() * 260) * (lunker ? 1.15 : 1),
        t: 0,
        size,
        splashedIn: false,
      });
      splash(x0, waterline(), lunker ? 20 : frenzyFish ? 7 : 10);
      ripples.push({ x: x0, y: waterline(), r: 4, alpha: lunker ? 1 : 0.8 });
    }

    // Bait spray — tiny panicked baitfish flicking out of the water.
    function baitSpray(x: number, count: number) {
      for (let i = 0; i < count; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
        const sp = 200 + Math.random() * 420;
        droplets.push({
          x: x + (Math.random() - 0.5) * 40,
          y: waterline(),
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 0,
          maxLife: 0.3 + Math.random() * 0.35,
          r: 0.8 + Math.random() * 1.2,
        });
      }
    }

    function splash(x: number, y: number, count: number) {
      for (let i = 0; i < count; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
        const sp = 120 + Math.random() * 320;
        droplets.push({
          x, y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 0,
          maxLife: 0.5 + Math.random() * 0.45,
          r: 1 + Math.random() * 2.2,
        });
      }
    }

    function drawWaves(time: number) {
      if (!ctx) return;
      const base = waterline();
      palette.waves.forEach((color, i) => {
        const amp = 6 + i * 5;
        const speed = 0.35 + i * 0.22;
        const yOff = i * 10;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 8) {
          const y = base + yOff + Math.sin(x * 0.012 + time * speed + i * 1.7) * amp
            + Math.sin(x * 0.03 - time * speed * 0.6) * (amp * 0.4);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();
      });
    }

    function frame(now: number) {
      if (!ctx || !canvas) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      clock += dt;

      ctx.clearRect(0, 0, width, height);

      // Underwater shadows gliding beneath the surface
      for (const s of shadows) {
        s.x += s.speed * s.dir * dt;
        const wob = Math.sin(clock * 1.4 + s.wobble) * 6;
        if (s.dir === 1 && s.x > width + 80) s.x = -80;
        if (s.dir === -1 && s.x < -80) s.x = width + 80;
        ctx.save();
        ctx.translate(s.x, s.y + wob);
        ctx.scale(s.dir, 1);
        drawFishShape(ctx, s.size, 0, palette.shadow);
        ctx.restore();
      }

      drawWaves(clock);

      // Frenzy "boil" — churning surface rings over the strike zone
      if (frenzy) {
        const boilAlpha = Math.min(0.5, (frenzy.until - clock) * 0.8);
        for (let i = 0; i < 3; i++) {
          const wobble = Math.sin(clock * 9 + i * 2.1) * 8;
          ctx.globalAlpha = boilAlpha * (0.5 + i * 0.2);
          ctx.strokeStyle = palette.ripple;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(
            frenzy.x + wobble + (i - 1) * 22,
            waterline() + 2,
            26 + i * 14 + Math.sin(clock * 7 + i) * 5,
            6 + i * 2.5,
            0, 0, Math.PI * 2,
          );
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      // Leap scheduling — steady ambient action, with the occasional lunker
      if (clock >= nextLeapAt) {
        spawnLeap({ lunker: Math.random() < 0.18 });
        nextLeapAt = clock + (1.6 + Math.random() * 2.4) / intensity;
      }

      // Feeding frenzy scheduling + execution
      if (clock >= nextFrenzyAt && !frenzy) {
        frenzy = {
          x: width * (0.2 + Math.random() * 0.6),
          until: clock + 1.6 + Math.random() * 0.8,
          nextSpawn: clock,
        };
        nextFrenzyAt = clock + (16 + Math.random() * 16) / intensity;
      }
      if (frenzy) {
        if (clock >= frenzy.until) {
          frenzy = null;
        } else {
          // Rapid-fire small fish + bait spray + churning surface
          if (clock >= frenzy.nextSpawn) {
            spawnLeap({ x: frenzy.x + (Math.random() - 0.5) * 70, frenzyFish: true });
            baitSpray(frenzy.x + (Math.random() - 0.5) * 60, 14);
            ripples.push({
              x: frenzy.x + (Math.random() - 0.5) * 50,
              y: waterline(),
              r: 2,
              alpha: 0.9,
            });
            frenzy.nextSpawn = clock + 0.12 + Math.random() * 0.18;
          }
        }
      }

      // Flying fish
      for (let i = fish.length - 1; i >= 0; i--) {
        const f = fish[i];
        f.t += dt;
        const x = f.x0 + f.vx * f.t;
        const y = waterline() + f.vy * f.t + 0.5 * GRAVITY * f.t * f.t;
        const vy = f.vy + GRAVITY * f.t;
        const angle = Math.atan2(vy, f.vx);

        if (y > waterline() + 4 && vy > 0) {
          if (!f.splashedIn) {
            splash(x, waterline(), 12);
            ripples.push({ x, y: waterline(), r: 4, alpha: 0.8 });
          }
          fish.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.translate(x, y);
        drawFishShape(ctx, f.size, angle, palette.fish);
        ctx.restore();
      }

      // Droplets
      for (let i = droplets.length - 1; i >= 0; i--) {
        const d = droplets[i];
        d.life += dt;
        if (d.life >= d.maxLife || d.y > waterline() + 24) { droplets.splice(i, 1); continue; }
        d.vy += GRAVITY * 0.6 * dt;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        ctx.globalAlpha = 1 - d.life / d.maxLife;
        ctx.fillStyle = palette.droplet;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.r += 90 * dt;
        r.alpha -= 1.4 * dt;
        if (r.alpha <= 0) { ripples.splice(i, 1); continue; }
        ctx.globalAlpha = r.alpha;
        ctx.strokeStyle = palette.ripple;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, r.r, r.r * 0.28, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      if (running) raf = requestAnimationFrame(frame);
    }

    resize();
    const observer = new ResizeObserver(resize);
    if (canvas.parentElement) observer.observe(canvas.parentElement);

    // A few ambient underwater shadows
    for (let i = 0; i < 3; i++) {
      shadows.push({
        x: Math.random() * width,
        y: waterline() + 24 + Math.random() * Math.max(20, height * 0.16),
        speed: 18 + Math.random() * 22,
        size: 30 + Math.random() * 26,
        dir: Math.random() < 0.5 ? 1 : -1,
        wobble: Math.random() * Math.PI * 2,
      });
    }

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduced) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    if (reduced) {
      // Static frame: shadows + waves, no motion.
      drawWaves(0);
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [tone, intensity]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className}`}
    />
  );
}
