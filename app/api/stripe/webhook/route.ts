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

  const object = event.data.object as unknown as { metadata?: Record<string, string> };
  if (object.metadata?.commerceOrderId && event.type.startsWith('checkout.session.')) {
    const { error } = await sb.rpc('fulfill_commerce_payment', { p_event: event.id, p_type: event.type, p_session: event.data.object });
    if (error) { console.error('[commerce webhook]', error); return NextResponse.json({ error: 'Order fulfillment failed' }, { status: 500 }); }
    return NextResponse.json({ ok: true });
  }

  // The RPC commits fulfillment and its deduplication record together. A
  // database error rolls both back so Stripe can safely retry this event.
  const { data: result, error } = await sb.rpc('fulfill_stripe_event', {
    p_event_id: event.id,
    p_event_type: event.type,
    p_object: event.data.object,
  });
  if (error) {
    console.error('[webhook] fulfillment failed', error);
    return NextResponse.json({ error: 'Fulfillment failed' }, { status: 500 });
  }
  if (result?.duplicate) return NextResponse.json({ ok: true, duplicate: true });

  // Email is best effort, outside the payment transaction. Failure must not
  // roll back or repeat a successfully applied purchase.
  if (result?.bid_id) {
    try {
      const { sendBidApprovalRequest } = await import('@/lib/email');
      const { data: bid, error: bidError } = await sb
        .from('ad_banner_bids')
        .select('*, slot:ad_banner_slots(label)')
        .eq('id', result.bid_id)
        .single();
      if (bidError) throw bidError;
      if (bid) {
        const slot = Array.isArray(bid.slot) ? bid.slot[0] : bid.slot;
        await sendBidApprovalRequest({
          bidId: bid.id,
          businessName: bid.business_name,
          businessEmail: bid.business_email,
          slotLabel: slot?.label ?? 'Ad Slot',
          durationDays: bid.duration_days,
          totalAmount: Number(bid.total_amount_aed),
          imageUrl: bid.image_url,
          targetUrl: bid.target_url,
          adminUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://uaeangler.com'}/admin/banner-bids`,
        });
      }
    } catch (error) {
      console.error('[webhook] failed to send bid approval email:', error);
    }
  }

  return NextResponse.json({ ok: true });
}
