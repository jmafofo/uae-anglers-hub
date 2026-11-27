import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { isCurrentPaidBooking, isHttpsUrl, type FilmBrand, type PaidBooking } from '@/lib/home-advertising';
import FishingShowcase from './FishingShowcase';

export default async function SponsoredFilms() {
  const brands: FilmBrand[] = [];
  try {
    const db = getSupabaseAdmin();
    const [placements, bookings] = await Promise.all([
      db.from('film_brand_placements').select('video_id,advertiser_id,brand_name,logo_url,target_url').eq('is_active', true),
      db.from('ad_banner_bids').select('user_id,business_name,status,stripe_capture_status,stripe_payment_intent_id,start_date,ends_at,ad_banner_slots!inner(position,is_active)')
        .eq('ad_banner_slots.position', 'home_hero_leaderboard').eq('ad_banner_slots.is_active', true).eq('status', 'active').eq('stripe_capture_status', 'captured').gt('ends_at', new Date().toISOString()),
    ]);
    if (placements.error || bookings.error) throw placements.error || bookings.error;
    const paid = new Set(((bookings.data ?? []) as PaidBooking[]).filter(booking => isCurrentPaidBooking(booking)).map(booking => booking.user_id));
    for (const row of placements.data ?? []) {
      if (paid.has(row.advertiser_id) && isHttpsUrl(row.target_url)) brands.push({ videoId: row.video_id, name: row.brand_name, logo: row.logo_url && isHttpsUrl(row.logo_url) ? row.logo_url : null, url: row.target_url });
    }
  } catch { /* Fail closed: never substitute an unverified association. */ }
  return <FishingShowcase brands={brands} />;
}
