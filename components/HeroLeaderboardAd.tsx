import Link from 'next/link';
import { Megaphone, ArrowUpRight } from 'lucide-react';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/** Existing paid hero inventory, displayed below the player, never over creator content. */
export async function HeroLeaderboardAd({ className = '', showPlaceholder = false }: { className?: string; showPlaceholder?: boolean }) {
  let ad: { business_name: string; image_url: string; target_url: string } | null = null;
  let bookingUrl = '/advertise#banner-bids';
  try {
    const admin = getSupabaseAdmin();
    const [banner, slot] = await Promise.all([
      admin.rpc('get_active_banner', { p_position: 'home_hero_leaderboard' }).maybeSingle<{ business_name: string; image_url: string; target_url: string }>(),
      admin.from('ad_banner_slots').select('id').eq('position', 'home_hero_leaderboard').eq('is_active', true).maybeSingle(),
    ]);
    ad = banner.data;
    if (slot.data) bookingUrl = `/advertise/bid?slot=${slot.data.id}`;
  } catch { /* Keep the page usable if advertising data is unavailable. */ }
  const safeUrl = (value: string) => { try { return new URL(value).protocol === 'https:'; } catch { return false; } };
  if (ad && safeUrl(ad.target_url) && safeUrl(ad.image_url)) return <aside className={`overflow-hidden rounded-xl border border-slate-200 bg-white ${className}`} aria-label="Paid sponsorship">
    <p className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Advertisement · {ad.business_name}</p>
    <a href={ad.target_url} target="_blank" rel="noopener noreferrer sponsored" className="block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={ad.image_url} alt={`Advertisement by ${ad.business_name}`} className="max-h-48 w-full object-contain" loading="lazy" />
    </a>
  </aside>;
  if (!showPlaceholder) return null;
  return <aside className={`rounded-xl border border-dashed border-teal-800/25 bg-white/95 ${className}`} aria-label="Available sponsorship placement">
    <Link href={bookingUrl} className="flex items-center gap-4 px-5 py-4 text-slate-700 hover:bg-teal-50">
      <Megaphone size={22} className="shrink-0 text-teal-800" />
      <span className="min-w-0 flex-1"><span className="block text-xs uppercase tracking-widest text-slate-500">Sponsor this showcase</span><span className="mt-1 block text-sm">Put your brand beside UAE fishing stories.</span></span>
      <ArrowUpRight size={20} className="shrink-0 text-teal-800" />
    </Link>
  </aside>;
}
