import Link from 'next/link';
import { Megaphone } from 'lucide-react';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * Server-rendered hero leaderboard ad.
 * Large rich-media banner (970×250) below the hero section.
 */
export async function HeroLeaderboardAd({
  className = '',
  showPlaceholder = false,
}: {
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
      .rpc('get_active_banner', { p_position: 'home_hero_leaderboard' })
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
        className={`relative overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.05] via-transparent to-transparent ${className}`}
        aria-label="Sponsored leaderboard ad"
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
            className="w-full object-cover group-hover:scale-[1.01] transition-transform duration-500"
            style={{
              aspectRatio: `${ad.width_px} / ${ad.height_px}`,
              maxHeight: Math.min(ad.height_px, 280),
            }}
            loading="lazy"
          />
        </a>
      </aside>
    );
  }

  if (!showPlaceholder) return null;

  return (
    <aside
      className={`relative overflow-hidden rounded-2xl border border-dashed border-amber-500/20 bg-amber-500/[0.03] ${className}`}
      aria-label="Available leaderboard ad slot"
    >
      <Link
        href="/advertise#banner-bids"
        className="flex flex-col items-center justify-center text-center p-6 group hover:bg-amber-500/[0.06] transition-colors"
        style={{ aspectRatio: '970 / 250', minHeight: 180 }}
      >
        <Megaphone className="w-7 h-7 text-amber-500/40 mb-3 group-hover:text-amber-400 transition-colors" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500/40 group-hover:text-amber-300 transition-colors">
          Advertise Here
        </span>
        <span className="text-[10px] text-amber-500/30 mt-1">Homepage Hero Leaderboard</span>
        <span className="text-[10px] text-amber-500/30">970×250px</span>
      </Link>
    </aside>
  );
}
