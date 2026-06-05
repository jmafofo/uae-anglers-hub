import Link from 'next/link';
import { Megaphone } from 'lucide-react';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export type BannerPosition =
  | 'home_left_sidebar'
  | 'home_right_sidebar'
  | 'community_sidebar'
  | 'spots_sidebar';

const PLACEHOLDER_SIZES: Record<BannerPosition, { w: number; h: number; label: string }> = {
  home_left_sidebar:    { w: 300, h: 600, label: 'Homepage Left Sidebar' },
  home_right_sidebar:   { w: 300, h: 600, label: 'Homepage Right Sidebar' },
  community_sidebar:    { w: 300, h: 600, label: 'Community Sidebar' },
  spots_sidebar:        { w: 300, h: 600, label: 'Spots Sidebar' },
};

/**
 * Server-rendered banner ad placement.
 * Checks for an active banner bid first.
 */
export async function BannerAdSlot({
  position,
  className = '',
  showPlaceholder = false,
}: {
  position: BannerPosition;
  className?: string;
  showPlaceholder?: boolean;
}) {
  let banner: {
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
    banner = data ?? null;
  } catch {
    banner = null;
  }

  if (banner) {
    return (
      <aside
        className={`relative overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.05] via-transparent to-transparent ${className}`}
        aria-label="Sponsored banner"
      >
        <div className="absolute top-2 right-2 z-10">
          <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-black/40 text-amber-300 border border-amber-500/40 backdrop-blur-sm">Ad</span>
        </div>
        <a
          href={banner.target_url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block group"
        >
          <img
            src={banner.image_url}
            alt={`Advertisement by ${banner.business_name}`}
            className="w-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
            style={{
              aspectRatio: `${banner.width_px} / ${banner.height_px}`,
              maxHeight: banner.height_px,
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
      className={`relative overflow-hidden rounded-2xl border border-dashed border-amber-500/20 bg-amber-500/[0.03] ${className}`}
      aria-label="Available banner ad slot"
    >
      <Link
        href="/advertise#banner-bids"
        className="flex flex-col items-center justify-center text-center p-4 group hover:bg-amber-500/[0.06] transition-colors"
        style={{
          aspectRatio: `${ph.w} / ${ph.h}`,
          minHeight: Math.min(ph.h, 300),
        }}
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
