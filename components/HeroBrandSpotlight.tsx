'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, BadgeCheck } from 'lucide-react';
import { onShowcase, type ShowcaseState } from '@/lib/showcase-sync';
import styles from './HeroBrandSpotlight.module.css';

/**
 * "Presented by" spotlight — lives in the hero's left column and stays in
 * sync with the film playing in the showcase panel. A sponsored clip shows
 * its paid brand(s) here; anything else turns the space into a sponsorship
 * pitch, so the slot always earns. Renders nothing until the player
 * announces its first clip.
 */
export default function HeroBrandSpotlight() {
  const [state, setState] = useState<ShowcaseState | null>(null);

  useEffect(() => onShowcase(setState), []);

  if (!state) return null;
  const sponsored = state.brands.length > 0;

  return (
    <div
      key={state.clipId}
      className={`rounded-2xl border border-[#e1e7eb] bg-white/85 p-5 backdrop-blur-sm ${styles.enter}`}
    >
      {sponsored ? (
        <>
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a651c]">
            <BadgeCheck size={13} aria-hidden />
            Presented by · Sponsored
          </p>
          <div className="mt-3 flex flex-col gap-3">
            {state.brands.map((brand) => (
              <a
                key={brand.name}
                href={brand.url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="group flex items-center gap-3"
              >
                {brand.logo && (
                  // eslint-disable-next-line @next/next/no-img-element -- advertiser logo, arbitrary host
                  <img src={brand.logo} alt="" className="h-9 w-20 shrink-0 object-contain" />
                )}
                <span className="min-w-0">
                  <span className="block truncate font-serif text-xl tracking-[-0.02em] text-[#18333f] group-hover:text-[#23675e]">
                    {brand.name}
                  </span>
                  <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-[#23675e]">
                    Visit partner <ArrowUpRight size={12} />
                  </span>
                </span>
              </a>
            ))}
          </div>
          <p className="mt-3 border-t border-[#eef2f3] pt-2.5 text-xs text-[#7a8891]">
            while “{state.clipTitle}” plays
          </p>
        </>
      ) : (
        <>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#27685f]">
            Sponsor this showcase
          </p>
          <p className="mt-2 font-serif text-xl leading-snug tracking-[-0.02em] text-[#18333f]">
            Put your brand beside UAE fishing stories.
          </p>
          <Link
            href="/advertise#banner-bids"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#23675e] underline underline-offset-[6px] hover:text-[#174e47]"
          >
            Become a partner <ArrowUpRight size={14} />
          </Link>
        </>
      )}
    </div>
  );
}
