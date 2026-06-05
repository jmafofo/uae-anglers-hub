import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUniversal } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/banner-bids
 * Returns bids for the authenticated user, or all bids if admin.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const admin = getSupabaseAdmin();
  const isAdmin = auth.user.app_metadata?.is_admin || (await admin.from('profiles').select('is_admin').eq('id', auth.user.id).maybeSingle())?.data?.is_admin;

  let query = admin
    .from('ad_banner_bids')
    .select('*, slot:ad_banner_slots(*)')
    .order('created_at', { ascending: false });

  if (!isAdmin) {
    query = query.eq('user_id', auth.user.id);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bids: data ?? [] });
}

/**
 * POST /api/banner-bids
 * Creates a draft banner bid. Does NOT create a Stripe session —
 * call POST /api/banner-bids/checkout next to start payment.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({}));
  const {
    slot_id,
    business_name,
    business_email,
    image_url,
    marquee_text,
    target_url,
    duration_days,
  } = body;

  // Validation
  if (!slot_id || !business_name?.trim() || !business_email?.trim() || !target_url?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const duration = Math.max(1, Math.min(90, Number(duration_days) || 7));
  if (!Number.isFinite(duration)) {
    return NextResponse.json({ error: 'Invalid duration' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Verify slot exists and is active
  const { data: slot } = await admin
    .from('ad_banner_slots')
    .select('base_price_per_day, slot_type')
    .eq('id', slot_id)
    .eq('is_active', true)
    .maybeSingle();

  if (!slot) {
    return NextResponse.json({ error: 'Slot not found or inactive' }, { status: 404 });
  }

  // Validate slot-type-specific fields
  const imageTypes = ['banner', 'sticky', 'inline', 'modal', 'interstitial'];
  const textTypes = ['marquee'];
  if (imageTypes.includes(slot.slot_type) && !image_url?.trim()) {
    return NextResponse.json({ error: `Image URL is required for ${slot.slot_type} slots` }, { status: 400 });
  }
  if (textTypes.includes(slot.slot_type) && !marquee_text?.trim()) {
    return NextResponse.json({ error: 'Marquee text is required for marquee slots' }, { status: 400 });
  }

  const totalAmount = Number(slot.base_price_per_day) * duration;

  const insertData: Record<string, unknown> = {
    slot_id,
    user_id: auth.user.id,
    business_name: business_name.trim(),
    business_email: business_email.trim(),
    target_url: target_url.trim(),
    duration_days: duration,
    total_amount_aed: totalAmount,
    status: 'draft',
  };
  if (imageTypes.includes(slot.slot_type)) {
    insertData.image_url = image_url.trim();
  } else {
    insertData.marquee_text = marquee_text.trim();
  }

  const { data: bid, error } = await admin
    .from('ad_banner_bids')
    .insert(insertData)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bid, totalAmount });
}
