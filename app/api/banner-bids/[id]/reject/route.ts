import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUniversal } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getStripe } from '@/lib/stripe';
import { sendBidStatusUpdate } from '@/lib/email';

/**
 * POST /api/banner-bids/[id]/reject
 * Admin only. Cancels the Stripe PaymentIntent and rejects the bid.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const admin = getSupabaseAdmin();

  // Verify admin
  const { data: profile } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Admins only' }, { status: 403 });
  }

  const { data: bid } = await admin
    .from('ad_banner_bids')
    .select('*, slot:ad_banner_slots(*)')
    .eq('id', id)
    .maybeSingle();

  if (!bid) {
    return NextResponse.json({ error: 'Bid not found' }, { status: 404 });
  }

  if (!['pending_approval', 'draft'].includes(bid.status)) {
    return NextResponse.json({ error: `Cannot reject bid with status: ${bid.status}` }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const adminNotes = body.admin_notes?.trim() || null;

  // Cancel Stripe PaymentIntent if present
  if (bid.stripe_payment_intent_id) {
    try {
      await getStripe().paymentIntents.cancel(bid.stripe_payment_intent_id);
    } catch (err: any) {
      // If already cancelled or captured, log but continue
      if (err.code !== 'payment_intent_unexpected_state') {
        console.error('[banner-bid] cancel failed:', err);
      }
    }
  }

  // Reject bid
  const { error } = await admin
    .from('ad_banner_bids')
    .update({
      status: 'rejected',
      stripe_capture_status: 'cancelled',
      admin_notes: adminNotes,
    })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notify business
  await sendBidStatusUpdate({
    to: bid.business_email,
    businessName: bid.business_name,
    slotLabel: (bid.slot as any)?.label ?? 'Ad Slot',
    status: 'rejected',
    adminNotes,
  });

  return NextResponse.json({ rejected: true });
}
