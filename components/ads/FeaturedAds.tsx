import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { isCurrentPaidBooking, isHttpsUrl } from '@/lib/home-advertising';
import FeaturedAdsCarousel, { type FeaturedAd } from './FeaturedAdsCarousel';

type BookingRow = {
  id: string;
  user_id: string;
  business_name: string;
  image_url: string | null;
  target_url: string | null;
  status: string;
  stripe_capture_status: string | null;
  stripe_payment_intent_id: string | null;
  start_date: string | null;
  ends_at: string | null;
  ad_banner_slots: { label: string; is_active: boolean; sort_order: number } | { label: string; is_active: boolean; sort_order: number }[] | null;
};

/**
 * FeaturedAds — server-side data for the premium homepage carousel.
 *
 * Shows direct-sold creatives: paid, captured, currently-running banner
 * bookings that supplied artwork and a target URL. One creative per
 * business, ordered by slot priority. Renders nothing when no inventory —
 * an empty carousel is worse than no carousel.
 *
 * Usage (server component): `<FeaturedAds />` — e.g. at the top of the
 * homepage sections. Renders `<FeaturedAdsCarousel>` client-side.
 */
export async function FeaturedAds({ limit = 6 }: { limit?: number }) {
  const ads: FeaturedAd[] = [];
  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from('ad_banner_bids')
      .select('id,user_id,business_name,image_url,target_url,status,stripe_capture_status,stripe_payment_intent_id,start_date,ends_at,ad_banner_slots!inner(label,is_active,sort_order)')
      .eq('status', 'active')
      .eq('stripe_capture_status', 'captured')
      .eq('ad_banner_slots.is_active', true)
      .gt('ends_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;

    const seen = new Set<string>();
    for (const row of (data ?? []) as BookingRow[]) {
      if (!isCurrentPaidBooking(row)) continue;
      if (!row.image_url || !row.target_url) continue;
      if (!isHttpsUrl(row.image_url) || !isHttpsUrl(row.target_url)) continue;
      if (seen.has(row.business_name)) continue;
      const slot = Array.isArray(row.ad_banner_slots) ? row.ad_banner_slots[0] : row.ad_banner_slots;
      seen.add(row.business_name);
      ads.push({
        id: row.id,
        businessName: row.business_name,
        imageUrl: row.image_url,
        targetUrl: row.target_url,
        slotLabel: slot?.label ?? 'Featured partner',
      });
      if (ads.length >= limit) break;
    }
  } catch (error) {
    console.error('[featured ads] inventory unavailable', error instanceof Error ? error.message : 'query failed');
  }

  if (ads.length === 0) return null;
  return <FeaturedAdsCarousel ads={ads} />;
}
