import Link from 'next/link';
import { Megaphone, ExternalLink } from 'lucide-react';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export type MarqueePosition = 'home_top_marquee';

/**
 * Server-rendered marquee ad placement.
 * Renders a horizontally scrolling text ad.
 */
export async function MarqueeAdSlot({
  position,
  className = '',
  showPlaceholder = false,
}: {
  position: MarqueePosition;
  className?: string;
  showPlaceholder?: boolean;
}) {
  let ad: {
    bid_id: string;
    business_name: string;
    marquee_text: string | null;
    target_url: string;
  } | null = null;

  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin
      .rpc('get_active_banner', { p_position: position })
      .maybeSingle<{
        bid_id: string;
        business_name: string;
        marquee_text: string | null;
        target_url: string;
      }>();
    ad = data ?? null;
  } catch {
    ad = null;
  }

  if (ad) {
    const text = ad.marquee_text?.trim() || `${ad.business_name} — Advertise with us`;
    return (
      <div className={`relative overflow-hidden bg-amber-500/10 border-y border-amber-500/30 ${className}`}>
        <div className="absolute top-1 right-2 z-10">
          <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-black/40 text-amber-300 border border-amber-500/40 backdrop-blur-sm">Ad</span>
        </div>
        <a
          href={ad.target_url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block py-2.5 group"
        >
          <div className="flex overflow-hidden">
            <div className="whitespace-nowrap animate-marquee flex items-center gap-8 text-sm">
              <span className="text-amber-200 font-medium">{text}</span>
              <ExternalLink className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="text-amber-200/50">•</span>
              <span className="text-amber-200 font-medium">{text}</span>
              <ExternalLink className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="text-amber-200/50">•</span>
              <span className="text-amber-200 font-medium">{text}</span>
              <ExternalLink className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="text-amber-200/50">•</span>
            </div>
          </div>
        </a>
      </div>
    );
  }

  if (!showPlaceholder) return null;

  return (
    <div className={`relative overflow-hidden rounded-xl border border-dashed border-amber-500/20 bg-amber-500/[0.03] ${className}`}>
      <Link
        href="/advertise#marquee-bids"
        className="flex items-center justify-center gap-2 py-2.5 px-4 group hover:bg-amber-500/[0.06] transition-colors"
      >
        <Megaphone className="w-4 h-4 text-amber-500/40 group-hover:text-amber-400 transition-colors" />
        <span className="text-xs font-bold uppercase tracking-wider text-amber-500/40 group-hover:text-amber-300 transition-colors">
          Marquee Ad Available — Scroll Your Message Here
        </span>
        <span className="text-[10px] text-amber-500/30 ml-1">1200×60px</span>
      </Link>
    </div>
  );
}
