import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUniversal } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * POST /api/trips/:id/rsvp
 * RSVP to a trip post (interested, confirmed, or declined).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const { id: tripPostId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const status = String(body.status ?? '').trim();
  if (!['interested', 'confirmed', 'declined'].includes(status)) {
    return NextResponse.json({ error: 'status must be interested, confirmed, or declined' }, { status: 400 });
  }

  const notes = body.notes ? String(body.notes).slice(0, 500) : null;

  const admin = getSupabaseAdmin();

  // Verify the trip exists and user is a club member
  const { data: trip } = await admin
    .from('trip_posts')
    .select('id, club_id, status, max_participants, rsvp_count')
    .eq('id', tripPostId)
    .maybeSingle();

  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  if (trip.status === 'cancelled' || trip.status === 'completed') {
    return NextResponse.json({ error: 'This trip is no longer accepting RSVPs' }, { status: 400 });
  }

  if (trip.status === 'full' && status !== 'declined') {
    // Check if user already has an active RSVP (they can change to declined)
    const { data: existing } = await admin
      .from('trip_rsvps')
      .select('id, status')
      .eq('trip_post_id', tripPostId)
      .eq('user_id', auth.user.id)
      .maybeSingle();
    if (!existing || existing.status === 'declined') {
      return NextResponse.json({ error: 'This trip is full' }, { status: 400 });
    }
  }

  // Check club membership
  const { data: membership } = await admin
    .from('club_members')
    .select('id')
    .eq('club_id', trip.club_id)
    .eq('user_id', auth.user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: 'You must be a club member to RSVP' }, { status: 403 });
  }

  // Upsert RSVP
  const { data, error } = await admin
    .from('trip_rsvps')
    .upsert(
      {
        trip_post_id: tripPostId,
        user_id: auth.user.id,
        status,
        notes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'trip_post_id,user_id' }
    )
    .select('*')
    .single();

  if (error) {
    console.error('[trips] rsvp', error);
    return NextResponse.json({ error: 'Failed to save RSVP' }, { status: 500 });
  }

  return NextResponse.json({ rsvp: data });
}

/**
 * DELETE /api/trips/:id/rsvp
 * Remove your RSVP.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const { id: tripPostId } = await params;
  const admin = getSupabaseAdmin();

  const { error } = await admin
    .from('trip_rsvps')
    .delete()
    .eq('trip_post_id', tripPostId)
    .eq('user_id', auth.user.id);

  if (error) {
    console.error('[trips] rsvp delete', error);
    return NextResponse.json({ error: 'Failed to remove RSVP' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/**
 * GET /api/trips/:id/rsvp
 * Get RSVP list for a trip. Requires club membership.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const { id: tripPostId } = await params;
  const admin = getSupabaseAdmin();

  // Verify membership via trip → club
  const { data: trip } = await admin
    .from('trip_posts')
    .select('club_id')
    .eq('id', tripPostId)
    .maybeSingle();

  if (!trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  const { data: membership } = await admin
    .from('club_members')
    .select('id')
    .eq('club_id', trip.club_id)
    .eq('user_id', auth.user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: 'Not a member of this club' }, { status: 403 });
  }

  const { data, error } = await admin
    .from('trip_rsvps')
    .select('*, profiles(id, display_name, username, avatar_url)')
    .eq('trip_post_id', tripPostId)
    .neq('status', 'declined')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[trips] rsvp list', error);
    return NextResponse.json({ error: 'Failed to load RSVPs' }, { status: 500 });
  }

  return NextResponse.json({
    rsvps: (data ?? []).map((r: any) => ({
      id: r.id,
      status: r.status,
      notes: r.notes,
      created_at: r.created_at,
      user: r.profiles,
    })),
  });
}
