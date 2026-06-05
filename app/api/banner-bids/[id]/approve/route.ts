import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUniversal } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getStripe } from '@/lib/stripe';
import { sendBidStatusUpdate } from '@/lib/email';

/**
 * POST /api/banner-bids/[id]/approve
 * Admin only. Captures the Stripe PaymentIntent and activates the bid.
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

  if (bid.status !== 'pending_approval') {
    return NextResponse.json({ error: `Cannot approve bid with status: ${bid.status}` }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const startDate = body.start_date ? new Date(body.start_date) : new Date();
  const adminNotes = body.admin_notes?.trim() || null;

  // Calculate end date
  const endsAt = new Date(startDate);
  endsAt.setDate(endsAt.getDate() + bid.duration_days);

  // Capture Stripe PaymentIntent
  if (bid.stripe_payment_intent_id) {
    try {
      await getStripe().paymentIntents.capture(bid.stripe_payment_intent_id);
    } catch (err: any) {
      console.error('[banner-bid] capture failed:', err);
      return NextResponse.json({ error: `Payment capture failed: ${err.message}` }, { status: 502 });
    }
  }

  // Activate bid
  const { error } = await admin
    .from('ad_banner_bids')
    .update({
      status: 'active',
      start_date: startDate.toISOString().split('T')[0],
      ends_at: endsAt.toISOString(),
      approved_by: auth.user.id,
      approved_at: new Date().toISOString(),
      stripe_capture_status: 'captured',
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
    status: 'approved',
    adminNotes,
  });

  return NextResponse.json({ approved: true });
}
