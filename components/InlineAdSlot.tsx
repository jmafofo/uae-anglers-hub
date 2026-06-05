import Link from 'next/link';
import { Megaphone } from 'lucide-react';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export type InlinePosition = 'home_inline_1' | 'home_inline_2' | 'spots_inline' | 'community_inline';

const PLACEHOLDER_SIZES: Record<InlinePosition, { w: number; h: number; label: string }> = {
  home_inline_1:     { w: 300, h: 250, label: 'Homepage Inline 1' },
  home_inline_2:     { w: 300, h: 250, label: 'Homepage Inline 2' },
  spots_inline:      { w: 300, h: 250, label: 'Spots Page Inline' },
  community_inline:  { w: 300, h: 250, label: 'Community Inline' },
};

/**
 * Server-rendered inline ad placement.
 * Renders a medium-rectangle ad embedded between content sections.
 */
export async function InlineAdSlot({
  position,
  className = '',
  showPlaceholder = false,
}: {
  position: InlinePosition;
  className?: string;
  showPlaceholder?: boolean;
}) {
  let ad: {
    bid_id: string;
    business_name: string;
    image_url: string;
    target_url: string;
    width_px: number;
    height_px: number;
  } | null = null;

  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin
      .rpc('get_active_banner', { p_position: position })
      .maybeSingle<{
        bid_id: string;
        business_name: string;
        image_url: string;
        target_url: string;
        width_px: number;
        height_px: number;
      }>();
    ad = data ?? null;
  } catch {
    ad = null;
  }

  if (ad) {
    return (
      <aside
        className={`relative overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.05] via-transparent to-transparent my-6 ${className}`}
        aria-label="Sponsored inline ad"
      >
        <div className="absolute top-2 right-2 z-10">
          <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-black/40 text-amber-300 border border-amber-500/40 backdrop-blur-sm">Ad</span>
        </div>
        <a
          href={ad.target_url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block group"
        >
          <img
            src={ad.image_url}
            alt={`Advertisement by ${ad.business_name}`}
            className="w-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
            style={{
              aspectRatio: `${ad.width_px} / ${ad.height_px}`,
              maxHeight: ad.height_px,
            }}
            loading="lazy"
          />
        </a>
      </aside>
    );
  }

  if (!showPlaceholder) return null;

  const ph = PLACEHOLDER_SIZES[position];
  return (
    <aside
      className={`relative overflow-hidden rounded-2xl border border-dashed border-amber-500/20 bg-amber-500/[0.03] my-6 ${className}`}
      aria-label="Available inline ad slot"
    >
      <Link
        href="/advertise#banner-bids"
        className="flex flex-col items-center justify-center text-center p-6 group hover:bg-amber-500/[0.06] transition-colors"
        style={{ aspectRatio: `${ph.w} / ${ph.h}` }}
      >
        <Megaphone className="w-6 h-6 text-amber-500/40 mb-3 group-hover:text-amber-400 transition-colors" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500/40 group-hover:text-amber-300 transition-colors">
          Advertise Here
        </span>
        <span className="text-[10px] text-amber-500/30 mt-1">{ph.label}</span>
        <span className="text-[10px] text-amber-500/30">{ph.w}×{ph.h}px</span>
      </Link>
    </aside>
  );
}
