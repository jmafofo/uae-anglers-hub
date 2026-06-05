import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

// Supabase admin client — bypasses RLS so webhook can update any profile
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: 'Invalid Stripe signature' }, { status: 400 });
  }

  const sb = adminClient();

  // ── Idempotency — skip events we've already processed ────────
  // Stripe retries on 2xx failures or network hiccups; without this
  // a single paid checkout could grant slots/boosts multiple times.
  const { error: dedupErr } = await sb
    .from('stripe_events')
    .insert({ event_id: event.id, type: event.type });
  if (dedupErr) {
    // 23505 = unique_violation — event already recorded. Acknowledge
    // so Stripe stops retrying, but don't re-run side effects.
    if ((dedupErr as { code?: string }).code === '23505') {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    console.error('[webhook] failed to record event', dedupErr);
    return NextResponse.json({ error: 'Event log failed' }, { status: 500 });
  }

  // ── checkout.session.completed ───────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { userId, type, qty, listingId } = session.metadata ?? {};
    if (!userId) return NextResponse.json({ ok: true });

    // Persist the Stripe customer id so the next checkout for this
    // user reuses the same Customer instead of creating a new one.
    const customerId = typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id ?? null;
    if (customerId) {
      await sb.from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)
        .is('stripe_customer_id', null);
    }

    if (type === 'ocean_sentinel') {
      await sb.from('profiles').update({
        ocean_sentinel_premium: true,
        ocean_sentinel_premium_until: null, // null = active subscription, no hard expiry
      }).eq('id', userId);
    }

    else if (type === 'pro') {
      await sb.from('profiles').update({
        subscription_tier: 'pro',
        subscription_status: 'active',
        account_type: 'pro',
        listing_slots_included: 50,
        verified_retailer: true,
      }).eq('id', userId);
    }

    else if (type === 'business') {
      await sb.from('profiles').update({
        subscription_tier: 'business',
        subscription_status: 'active',
        account_type: 'business',
        listing_slots_included: 999999,
        verified_retailer: true,
      }).eq('id', userId);
    }

    else if (type === 'slots') {
      const slotsQty = Math.max(1, parseInt(qty ?? '1', 10));
      // Insert into slot_purchases — trigger apply_slot_purchase() increments extra slots
      await sb.from('slot_purchases').insert({
        user_id: userId,
        slots_qty: slotsQty,
        amount_aed: slotsQty * 5,
        payment_ref: session.payment_intent as string ?? null,
      });
    }

    else if (type === 'boost' && listingId) {
      const now = new Date();
      const boostedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Insert boost audit record (trigger set_boost_until() fills boosted_until)
      await sb.from('boost_purchases').insert({
        user_id: userId,
        listing_id: listingId,
        amount_aed: 20,
        duration_days: 7,
        boosted_from: now.toISOString(),
        payment_ref: session.payment_intent as string ?? null,
      });

      // Mark listing as boosted
      await sb.from('listings').update({
        is_boosted: true,
        boosted_until: boostedUntil.toISOString(),
      }).eq('id', listingId);
    }

    else if (type === 'banner_bid') {
      const bidId = session.metadata?.bidId;
      if (bidId) {
        // Update bid from draft to pending_approval and store payment intent
        const { data: existing } = await sb
          .from('ad_banner_bids')
          .select('id, status')
          .eq('id', bidId)
          .maybeSingle();

        if (existing && existing.status === 'draft') {
          await sb.from('ad_banner_bids')
            .update({
              status: 'pending_approval',
              stripe_payment_intent_id: session.payment_intent as string ?? null,
              stripe_capture_status: 'authorized',
            })
            .eq('id', bidId);

          // Send admin notification email (fire-and-forget)
          try {
            const { sendBidApprovalRequest } = await import('@/lib/email');
            const { data: bid } = await sb
              .from('ad_banner_bids')
              .select('*, slot:ad_banner_slots(label)')
              .eq('id', bidId)
              .single();
            if (bid) {
              const origin = req.headers.get('origin') ?? 'https://uaeangler.com';
              await sendBidApprovalRequest({
                bidId: bid.id,
                businessName: bid.business_name,
                businessEmail: bid.business_email,
                slotLabel: (bid.slot as any)?.label ?? 'Ad Slot',
                durationDays: bid.duration_days,
                totalAmount: Number(bid.total_amount_aed),
                imageUrl: bid.image_url,
                targetUrl: bid.target_url,
                adminUrl: `${origin}/admin/banner-bids`,
              });
            }
          } catch (e) {
            console.error('[webhook] failed to send bid approval email:', e);
          }
        }
      }
    }
  }

  // ── customer.subscription.deleted → downgrade ────────────────
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId;
    const type = subscription.metadata?.type;
    if (userId) {
      if (type === 'ocean_sentinel') {
        await sb.from('profiles').update({
          ocean_sentinel_premium: false,
          ocean_sentinel_premium_until: new Date().toISOString(),
        }).eq('id', userId);
      } else {
        await sb.from('profiles').update({
          subscription_tier: 'free',
          subscription_status: 'cancelled',
          account_type: 'individual',
          listing_slots_included: 5,
          verified_retailer: false,
        }).eq('id', userId);
      }
    }
  }

  // ── customer.subscription.updated → handle plan changes ───────
  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId;
    const type = subscription.metadata?.type;
    if (userId && subscription.status === 'active') {
      const updates = type === 'pro'
        ? { subscription_tier: 'pro', subscription_status: 'active', account_type: 'pro', listing_slots_included: 50, verified_retailer: true }
        : type === 'business'
        ? { subscription_tier: 'business', subscription_status: 'active', account_type: 'business', listing_slots_included: 999999, verified_retailer: true }
        : null;
      if (updates) await sb.from('profiles').update(updates).eq('id', userId);
    }
  }

  return NextResponse.json({ ok: true });
}
