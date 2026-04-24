'use client';

import { useEffect, useRef, useState } from 'react';
import { Crown } from 'lucide-react';

// Experimental in Chromium; not on Firefox or stable Safari.
type FaceBox = { x: number; y: number; width: number; height: number };
type FDShape = new (o?: { fastMode?: boolean; maxDetectedFaces?: number }) => {
  detect(img: HTMLImageElement): Promise<{ boundingBox: FaceBox }[]>;
};

declare global {
  interface Window { FaceDetector?: FDShape }
}

type Props = {
  src: string;
  alt: string;
  className?: string;
  /** Crown SVG size in pixels. Scales with image width up to this cap. */
  maxCrownPx?: number;
};

type Placement = { leftPct: number; topPct: number; widthPct: number };

/**
 * Renders a catch photo with a glowing king's crown pinned above the
 * largest detected face. Where the experimental FaceDetector API is
 * unavailable (Firefox, Safari), falls back to a sensible top-center
 * placement so every browser still shows a crowned winner.
 */
export function KingCrown({ src, alt, className, maxCrownPx = 72 }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [placement, setPlacement] = useState<Placement>({
    leftPct: 50, topPct: 8, widthPct: 22,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) return;
    const img = imgRef.current;
    if (!img || typeof window === 'undefined' || !window.FaceDetector) return;

    let cancelled = false;
    (async () => {
      try {
        const detector = new window.FaceDetector!({ fastMode: true, maxDetectedFaces: 3 });
        const faces = await detector.detect(img);
        if (cancelled || faces.length === 0) return;

        const top = faces.reduce((a, b) =>
          a.boundingBox.y <= b.boundingBox.y ? a : b);
        const { x, y, width, height } = top.boundingBox;
        const iw = img.naturalWidth  || img.width;
        const ih = img.naturalHeight || img.height;
        if (!iw || !ih) return;

        setPlacement({
          leftPct: ((x + width / 2) / iw) * 100,
          topPct:  Math.max(0, (y / ih) * 100 - 8),
          widthPct: Math.min(40, (width / iw) * 100 * 0.9),
        });
      } catch {
        // silent — keep fallback placement
      }
    })();
    return () => { cancelled = true; };
  }, [loaded, src]);

  return (
    <div className={`relative inline-block ${className ?? ''}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        crossOrigin="anonymous"
        onLoad={() => setLoaded(true)}
        className="w-full h-full object-cover rounded-xl border border-white/10"
      />
      <div
        className="absolute -translate-x-1/2 -translate-y-full pointer-events-none transition-all duration-500"
        style={{
          left: `${placement.leftPct}%`,
          top: `${placement.topPct}%`,
          width: `min(${placement.widthPct}%, ${maxCrownPx}px)`,
          aspectRatio: '1 / 1',
        }}
      >
        <Crown
          className="w-full h-full text-amber-300 drop-shadow-[0_0_14px_rgba(252,211,77,0.75)]"
          strokeWidth={1.5}
          fill="currentColor"
          fillOpacity={0.3}
        />
      </div>
    </div>
  );
}
