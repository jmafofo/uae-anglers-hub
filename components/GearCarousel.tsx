'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, BadgeCheck, ShoppingBag } from 'lucide-react';
import type { SponsoredProduct } from '@/lib/home-advertising';
import { onShowcase } from '@/lib/showcase-sync';

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * The Tackle Ticker — a slow, continuous drift of merchandise from paid-up
 * advertisers (picture, price, verified dealer). Pauses on hover/focus.
 *
 * Synced to the hero film player: when a sponsored clip plays, the
 * presenting brand's products lead the rail with a gold "From the film"
 * treatment — the sponsorship moment connects story to merchandise.
 *
 * Reduced motion (or very few products): a calm, manually scrollable rail.
 */
export default function GearCarousel({ products }: { products: SponsoredProduct[] }) {
  const [leadBrands, setLeadBrands] = useState<string[]>([]);
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => onShowcase((state) => setLeadBrands(state.brands.map((b) => normalize(b.name)))), []);

  const isLead = (p: SponsoredProduct) => {
    const dealer = normalize(p.dealer);
    return leadBrands.some((b) => dealer === b || dealer.includes(b) || b.includes(dealer));
  };

  // Presenting brand's gear first, then the rest in original order.
  const ordered = useMemo(() => {
    if (!leadBrands.length) return products;
    return [...products.filter(isLead), ...products.filter((p) => !isLead(p))];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, leadBrands]);

  const drifting = !reduced && ordered.length >= 3;

  const card = (product: SponsoredProduct, key: string, ariaHidden = false) => {
    const lead = isLead(product);
    return (
      <Link
        key={key}
        href={`/shop/${product.id}`}
        aria-hidden={ariaHidden}
        tabIndex={ariaHidden ? -1 : undefined}
        className={`group relative w-[280px] shrink-0 snap-start overflow-hidden rounded-xl border bg-[#f8faf9] transition-colors sm:w-[300px] ${
          lead
            ? 'border-[#d4af5a]/70 ring-2 ring-[#d4af5a]/50 hover:border-[#b8892d]'
            : 'border-slate-200 hover:border-teal-600'
        }`}
      >
        {lead && (
          <span className="absolute left-3 top-3 z-10 rounded-full border border-[#d4af5a]/60 bg-[#faf3e3] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a651c]">
            From the film
          </span>
        )}
        <div className="h-44 bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.image} alt={ariaHidden ? '' : product.title} loading="lazy" className="h-full w-full object-contain" />
        </div>
        <div className="p-4">
          <p className="flex items-center gap-1.5 truncate text-xs text-slate-500">
            <BadgeCheck size={13} className="shrink-0 text-[#b8892d]" aria-label="Verified paid partner" />
            {product.dealer}{product.emirate ? ` · ${product.emirate}` : ''}
          </p>
          <h3 className="mt-1 truncate font-medium group-hover:text-teal-800">{product.title}</h3>
          <div className="mt-3 flex items-center justify-between">
            <span className="font-serif text-xl tracking-tight text-[#18333f]">
              AED {product.price.toLocaleString('en-AE', { maximumFractionDigits: 2 })}
            </span>
            <ArrowUpRight size={17} className="text-teal-800" />
          </div>
        </div>
      </Link>
    );
  };

  return (
    <section aria-label="Sponsored fishing gear" className="border-y border-slate-200 bg-white py-8 text-slate-900 sm:py-10">
      <div className="coastal-wrap coastal-hero-wide">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="coastal-eyebrow !text-[10px]">The tackle edit · Sponsored</p>
            <h2 className="mt-2 font-serif text-2xl tracking-tight sm:text-3xl">Ready for your next cast.</h2>
          </div>
          <Link href="/shop" className="text-sm font-medium text-teal-800 hover:underline">
            Explore the marketplace ↗
          </Link>
        </div>

        {ordered.length === 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-teal-900/10 bg-[#f3f8f6] p-6 sm:px-8">
            <div className="flex items-center gap-4">
              <ShoppingBag className="shrink-0 text-teal-800" size={28} />
              <div>
                <h3 className="font-medium">Your next customer is already here.</h3>
                <p className="mt-1 text-sm text-slate-600">Showcase your tackle, boats and outdoor gear to UAE anglers.</p>
              </div>
            </div>
            <Link href="/advertise#banner-bids" className="coastal-button !py-3 !text-sm">
              Become a partner <ArrowUpRight size={16} />
            </Link>
          </div>
        ) : drifting ? (
          <div
            className="group overflow-hidden"
            role="region"
            aria-label="Products from paid advertisers — continuous showcase, hover to pause"
          >
            <div className="flex w-max gap-4 pb-3 group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] [animation:marquee_45s_linear_infinite]">
              {ordered.map((p) => card(p, p.id))}
              {ordered.map((p) => card(p, `${p.id}-loop`, true))}
            </div>
          </div>
        ) : (
          <div
            role="region"
            aria-label="Products from paid advertisers"
            tabIndex={0}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 focus-visible:outline-teal-700"
          >
            {ordered.map((p) => card(p, p.id))}
          </div>
        )}
      </div>
    </section>
  );
}
