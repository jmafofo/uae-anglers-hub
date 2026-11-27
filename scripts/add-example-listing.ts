import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
if (typeof globalThis.WebSocket === 'undefined') {
  (globalThis as Record<string, unknown>).WebSocket = class { constructor() { throw new Error('no realtime'); } };
}
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

/**
 * One-off demo: Penn Authority 5500 @ AED 1,875 with an approved
 * 'hot_deal' product promotion (was AED 2,499) so the badge and
 * strikethrough price can be reviewed on the live marketplace.
 * Delete via: delete from product_promotions / listings where id = <printed ids>.
 */
async function main() {
  // Seller: the official demo account, created on first run
  const DEMO_EMAIL = 'showcase@uaeangler.com';
  let seller: { id: string } | undefined;
  for (let page = 1; !seller; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    seller = data.users.find((u) => u.email?.toLowerCase() === DEMO_EMAIL);
    if (data.users.length < 1000) break;
  }
  if (!seller) {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: crypto.randomUUID() + crypto.randomUUID(),
      email_confirm: true,
      user_metadata: { display_name: 'UAEAngler Tackle' },
    });
    if (createError || !created.user) throw new Error(`Demo seller creation failed: ${createError?.message}`);
    seller = created.user;
    console.log(`Created demo seller: ${seller.id}`);
    const { data: prof, error: profError } = await admin.from('profiles')
      .update({ display_name: 'UAEAngler Tackle', username: 'uaeangler-tackle' })
      .eq('id', seller.id).select('id');
    if (profError || !prof?.length) {
      console.warn(`Warning: demo seller profile not updated (${profError?.message ?? 'no profile row yet'}); listing may show without a seller name.`);
    }
  }
  console.log(`Seller: ${seller.id} (${DEMO_EMAIL})`);

  const { data: existingRows } = await admin.from('listings').select('id').eq('user_id', seller.id).eq('title', 'Penn Authority 5500 Spinning Reel').limit(1);
  const existingListing = (existingRows ?? [])[0] as { id: string } | undefined;
  const listing: { id: string } = existingListing ?? await admin.from('listings').insert({
    user_id: seller.id,
    title: 'Penn Authority 5500 Spinning Reel',
    description: 'Flagship Penn Authority 5500 — IPX6 sealed body and spool, CNC-cut stainless steel gears, HT-100 carbon-fibre drag. Boxed and unused; shop display unit.',
    category: 'Reel',
    condition: 'new',
    price: 1875,
    listing_type: 'fixed',
    emirate: 'Dubai',
    photos: [],
  }).select('id').single().then(({ data, error }) => {
    if (error || !data) throw new Error(`Listing insert failed: ${error?.message}`);
    return data;
  });
  console.log(`Listing: ${listing.id}  →  /shop/${listing.id}`);

  const { data: slot } = await admin.from('ad_banner_slots').select('id').limit(1).single();
  if (!slot) throw new Error('No ad_banner_slots row found for the required bid reference');
  const { data: existingBidRows } = await admin.from('ad_banner_bids').select('id').eq('user_id', seller.id).eq('business_name', 'UAEAngler demo').limit(1);
  const existingBid = (existingBidRows ?? [])[0] as { id: string } | undefined;
  const bid: { id: string } = existingBid ?? await admin.from('ad_banner_bids').insert({
    slot_id: slot.id,
    user_id: seller.id,
    business_name: 'UAEAngler demo',
    business_email: 'info@uaeangler.com',
    image_url: 'https://uaeangler.com/logo-icon.png',
    target_url: 'https://uaeangler.com/shop',
    duration_days: 1,
    total_amount_aed: 0,
    status: 'draft',
  }).select('id').single().then(({ data, error }) => {
    if (error || !data) throw new Error(`Bid insert failed: ${error?.message}`);
    return data;
  });
  console.log(`Bid (draft, demo): ${bid.id}`);

  const { data: existingPromoRows } = await admin.from('product_promotions').select('id').eq('listing_id', listing.id).eq('bid_id', bid.id).eq('tag', 'hot_deal').limit(1);
  const existingPromo = (existingPromoRows ?? [])[0] as { id: string } | undefined;
  const promo: { id: string } = existingPromo ?? await admin.from('product_promotions').insert({
    listing_id: listing.id,
    bid_id: bid.id,
    tag: 'hot_deal',
    previous_price_fils: 249900,
    approved: true,
  }).select('id').single().then(({ data, error }) => {
    if (error || !data) throw new Error(`Promotion insert failed: ${error?.message}`);
    return data;
  });
  console.log(`Promotion: ${promo.id} (hot_deal, approved, was AED 2,499)`);
}
main().catch((e) => { console.error(e); process.exit(1); });
