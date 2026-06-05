import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/banner-slots
 * Public endpoint listing available banner ad slots.
 * Optionally checks if a slot has an active bid.
 */
export async function GET(_req: NextRequest) {
  const admin = getSupabaseAdmin();

  const { data: slots, error } = await admin
    .from('ad_banner_slots')
    .select('id, position, label, description, slot_type, width_px, height_px, base_price_per_day, is_active, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Check which slots currently have active bids
  const { data: activeBids } = await admin
    .from('ad_banner_bids')
    .select('slot_id')
    .eq('status', 'active')
    .gt('ends_at', new Date().toISOString());

  const activeSlotIds = new Set(activeBids?.map(b => b.slot_id) ?? []);

  return NextResponse.json({
    slots: (slots ?? []).map(s => ({
      ...s,
      has_active_bid: activeSlotIds.has(s.id),
    })),
  });
}
