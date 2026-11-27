'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';

export interface FeaturedAd {
  id: string;
  businessName: string;
  imageUrl: string;
  targetUrl: string;
  slotLabel: string;
}

const AUTOPLAY_MS = 6000;

/**
 * FeaturedAdsCarousel — the premium hero placement for direct-sold ads.
 *
 * One card at a time, full-bleed imagery, autoplay with pause on
 * hover/focus/hidden-tab, swipe on touch, arrows + progress dots.
 * Honors prefers-reduced-motion (no autoplay). This is the only ad
 * surface designed to be *looked at* — everything else is backfill.
 */
export default function FeaturedAdsCarousel({ ads }: { ads: FeaturedAd[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const count = ads.length;

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex((i) => (i + 1) % count);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [paused, count]);

  if (count === 0) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured sponsors"
      className="relative overflow-hidden rounded-2xl border border-[#e1e7eb] bg-[#0a1828] shadow-[0_18px_50px_#173b4a14]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchStartX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        touchStartX.current = null;
      }}
    >
      {/* Track */}
      <div
        className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {ads.map((ad, i) => (
          <a
            key={ad.id}
            href={ad.targetUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            aria-hidden={i !== index}
            tabIndex={i === index ? 0 : -1}
            className="group relative block w-full shrink-0"
          >
            <div className="relative h-64 w-full sm:h-80 lg:h-96">
              {/* eslint-disable-next-line @next/next/no-img-element -- advertiser creative, arbitrary host */}
              <img
                src={ad.imageUrl}
                alt={`${ad.businessName} — featured sponsor`}
                loading={i === 0 ? 'eager' : 'lazy'}
                className="h-full w-full object-cover"
              />
              {/* Scrim + content */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1828e6] via-[#0a182855] to-transparent" />
              <span className="absolute left-4 top-4 rounded-full border border-white/25 bg-black/35 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/85 backdrop-blur-sm">
                Sponsored
              </span>
              <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 sm:inset-x-7 sm:bottom-6">
                <div className="min-w-0">
                  <p className="font-serif text-[clamp(1.5rem,3vw,2.4rem)] leading-tight tracking-[-0.02em] text-white">
                    {ad.businessName}
                  </p>
                  <p className="mt-1 text-sm text-white/70">{ad.slotLabel}</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/95 px-4 py-2.5 text-sm font-semibold text-[#18333f] transition-transform duration-200 group-hover:scale-[1.04]">
                  Visit
                  <ArrowUpRight size={15} />
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Controls */}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous sponsor"
            className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full border border-white/20 bg-black/30 p-2.5 text-white backdrop-blur-sm transition-colors hover:bg-black/50 sm:block"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next sponsor"
            className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full border border-white/20 bg-black/30 p-2.5 text-white backdrop-blur-sm transition-colors hover:bg-black/50 sm:block"
          >
            <ChevronRight size={18} />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {ads.map((ad, i) => (
              <button
                key={ad.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Go to sponsor ${i + 1} of ${count}`}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? 'w-6 bg-[#d4af5a]' : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
