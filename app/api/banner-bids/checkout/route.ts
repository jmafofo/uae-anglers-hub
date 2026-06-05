import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUniversal } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getStripe } from '@/lib/stripe';

function formatSlotTypeLabel(type: string | undefined): string {
  switch (type) {
    case 'marquee': return 'Marquee Ad';
    case 'sticky': return 'Sticky Banner';
    case 'inline': return 'Inline Ad';
    case 'modal': return 'Modal Ad';
    case 'interstitial': return 'Interstitial Ad';
    default: return 'Banner Ad';
  }
}

/**
 * POST /api/banner-bids/checkout
 * Creates a Stripe Checkout session for an existing draft bid.
 * Uses manual capture so payment is authorized but not charged until admin approval.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({}));
  const { bid_id } = body;

  if (!bid_id) {
    return NextResponse.json({ error: 'bid_id required' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Fetch the draft bid
  const { data: bid } = await admin
    .from('ad_banner_bids')
    .select('*, slot:ad_banner_slots(label, position, base_price_per_day, slot_type)')
    .eq('id', bid_id)
    .eq('user_id', auth.user.id)
    .eq('status', 'draft')
    .maybeSingle();

  if (!bid) {
    return NextResponse.json({ error: 'Draft bid not found' }, { status: 404 });
  }

  const amountFils = Math.round(Number(bid.total_amount_aed) * 100);
  const origin = req.headers.get('origin') ?? 'https://uaeangler.com';

  // Resolve Stripe customer
  const { data: profile } = await admin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', auth.user.id)
    .maybeSingle();

  const customerParam = profile?.stripe_customer_id
    ? { customer: profile.stripe_customer_id }
    : { customer_email: bid.business_email };

  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'aed',
        unit_amount: amountFils,
        product_data: {
          name: `${formatSlotTypeLabel((bid.slot as any)?.slot_type)} — ${(bid.slot as any)?.label ?? 'Ad Slot'}`,
          description: `${bid.duration_days} days • ${(bid.slot as any)?.position ?? ''}`,
        },
      },
      quantity: 1,
    }],
    payment_intent_data: {
      capture_method: 'manual',
    },
    success_url: `${origin}/advertise/bid-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/advertise#banner-bids`,
    ...customerParam,
    metadata: {
      userId: auth.user.id,
      type: 'banner_bid',
      bidId: bid_id,
    },
  });

  // Store checkout session id on the bid
  await admin
    .from('ad_banner_bids')
    .update({ stripe_checkout_session_id: session.id })
    .eq('id', bid_id);

  return NextResponse.json({ url: session.url });
}
