import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  // ── Verify user session ───────────────────────────────────────
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = auth.slice(7);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { type, qty = 1, listingId } = await req.json();
  const userId = user.id;
  const origin = req.headers.get('origin') ?? 'https://uaeangler.com';

  // ── Create Stripe Checkout session by type ────────────────────
  if (type === 'pro' || type === 'business') {
    // Recurring subscription — requires Price IDs created in Stripe Dashboard
    const priceId = type === 'pro'
      ? process.env.STRIPE_PRICE_PRO
      : process.env.STRIPE_PRICE_BUSINESS;

    if (!priceId) {
      return NextResponse.json(
        { error: `Missing env var STRIPE_PRICE_${type.toUpperCase()}` },
        { status: 500 }
      );
    }

    const session = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/advertise/success?session_id={CHECKOUT_SESSION_ID}&plan=${type}`,
      cancel_url: `${origin}/advertise#pricing`,
      customer_email: user.email,
      metadata: { userId, type },
      subscription_data: { metadata: { userId, type } },
    });

    return NextResponse.json({ url: session.url });
  }

  if (type === 'slots') {
    const slots = Math.max(1, Math.min(50, Number(qty)));
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'aed',
          unit_amount: 500, // AED 5 = 500 fils
          product_data: {
            name: `Extra Listing Slot${slots > 1 ? 's' : ''}`,
            description: `Add ${slots} extra listing slot${slots > 1 ? 's' : ''} to your Free account`,
          },
        },
        quantity: slots,
      }],
      success_url: `${origin}/shop/create?slots_added=${slots}`,
      cancel_url: `${origin}/advertise#slots`,
      customer_email: user.email,
      metadata: { userId, type: 'slots', qty: String(slots) },
    });

    return NextResponse.json({ url: session.url });
  }

  if (type === 'boost') {
    if (!listingId) {
      return NextResponse.json({ error: 'listingId required for boost' }, { status: 400 });
    }
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'aed',
          unit_amount: 2000, // AED 20 = 2000 fils
          product_data: {
            name: 'Boosted Listing — 7 Days',
            description: 'Pin your listing to the top of the marketplace for 7 days',
          },
        },
        quantity: 1,
      }],
      success_url: `${origin}/shop/${listingId}?boosted=1`,
      cancel_url: `${origin}/shop/${listingId}`,
      customer_email: user.email,
      metadata: { userId, type: 'boost', listingId },
    });

    return NextResponse.json({ url: session.url });
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
