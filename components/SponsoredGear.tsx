import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { isCurrentPaidBooking, isHttpsUrl, type PaidBooking, type SponsoredProduct } from '@/lib/home-advertising';
import GearCarousel from './GearCarousel';

export async function SponsoredGear() {
  const products: SponsoredProduct[] = [];
  try {
    const db = getSupabaseAdmin();
    const { data: bookings, error } = await db.from('ad_banner_bids')
      .select('user_id,business_name,status,stripe_capture_status,stripe_payment_intent_id,start_date,ends_at,ad_banner_slots!inner(position,is_active)')
      .eq('ad_banner_slots.position', 'home_hero_leaderboard').eq('ad_banner_slots.is_active', true)
      .eq('status', 'active').eq('stripe_capture_status', 'captured').gt('ends_at', new Date().toISOString());
    if (error) throw error;
    const dealers = new Map<string, string>();
    for (const booking of (bookings ?? []) as PaidBooking[]) {
      if (isCurrentPaidBooking(booking)) dealers.set(booking.user_id, booking.business_name);
    }
    if (dealers.size) {
      const { data, error: listingError } = await db.from('listings')
        .select('id,user_id,title,price,photos,emirate,profiles!inner(id)')
        .in('user_id', [...dealers.keys()]).eq('is_active', true).eq('is_sold', false)
        .order('created_at', { ascending: false }).limit(100);
      if (listingError) throw listingError;
      const counts = new Map<string, number>();
      for (const listing of data ?? []) {
        const image = listing.photos?.[0];
        const price = Number(listing.price);
        if (!image || !isHttpsUrl(image) || listing.price == null || !Number.isFinite(price) || price <= 0) continue;
        if ((counts.get(listing.user_id) ?? 0) >= 3) continue;
        counts.set(listing.user_id, (counts.get(listing.user_id) ?? 0) + 1);
        products.push({ id: listing.id, title: listing.title, price, image, dealer: dealers.get(listing.user_id)!, emirate: listing.emirate });
        if (products.length >= 12) break;
      }
    }
  } catch (error) { console.error('[homepage advertising] Inventory unavailable', error instanceof Error ? error.message : 'query failed'); }

  if (products.length > 0) return <GearCarousel products={products} mode="sponsored" />;

  // No paid inventory: fall back to real marketplace listings so the rail
  // is never dead space — labelled honestly as organic marketplace content.
  const organic: SponsoredProduct[] = [];
  try {
    const db = getSupabaseAdmin();
    const { data } = await db.from('listings')
      .select('id,title,price,photos,emirate,profiles!inner(display_name,username)')
      .eq('is_active', true).eq('is_sold', false)
      .order('created_at', { ascending: false }).limit(30);
    for (const listing of data ?? []) {
      const image = listing.photos?.[0];
      const price = Number(listing.price);
      if (!image || !isHttpsUrl(image) || listing.price == null || !Number.isFinite(price) || price <= 0) continue;
      const seller = Array.isArray(listing.profiles) ? listing.profiles[0] : listing.profiles;
      organic.push({
        id: listing.id,
        title: listing.title,
        price,
        image,
        dealer: (seller as { display_name?: string; username?: string } | null)?.display_name
          ?? (seller as { username?: string } | null)?.username
          ?? 'UAE angler',
        emirate: listing.emirate,
      });
      if (organic.length >= 12) break;
    }
  } catch (error) { console.error('[homepage advertising] Marketplace fallback unavailable', error instanceof Error ? error.message : 'query failed'); }

  return <GearCarousel products={organic} mode="marketplace" />;
}
