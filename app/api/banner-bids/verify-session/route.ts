import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { sendBidApprovalRequest } from '@/lib/email';

/**
 * GET /api/banner-bids/verify-session?session_id=xxx
 * Verifies a Checkout session for a banner bid and updates the bid status.
 * Called by the success page as a fallback when the webhook may be delayed.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'session_id required' }, { status: 400 });
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== 'paid') {
    return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
  }

  const bidId = session.metadata?.bidId;
  if (!bidId) {
    return NextResponse.json({ error: 'No bid linked to session' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const { data: bid } = await admin
    .from('ad_banner_bids')
    .select('*, slot:ad_banner_slots(label)')
    .eq('id', bidId)
    .maybeSingle();

  if (!bid) {
    return NextResponse.json({ error: 'Bid not found' }, { status: 404 });
  }

  // If still draft, upgrade to pending_approval
  if (bid.status === 'draft') {
    await admin
      .from('ad_banner_bids')
      .update({
        status: 'pending_approval',
        stripe_payment_intent_id: session.payment_intent as string ?? null,
        stripe_capture_status: 'authorized',
      })
      .eq('id', bidId);

    // Send admin email (only when transitioning from draft)
    try {
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
    } catch (e) {
      console.error('[verify-session] email failed:', e);
    }

    return NextResponse.json({ ok: true, status: 'pending_approval' });
  }

  return NextResponse.json({ ok: true, status: bid.status });
}
