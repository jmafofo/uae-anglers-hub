import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUniversal } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * POST /api/clubs/:slug/join
 * Accept an invite to a club, or join a public club.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const { slug } = await params;
  const admin = getSupabaseAdmin();

  const { data: club } = await admin
    .from('clubs')
    .select('id, visibility, member_count, max_participants')
    .eq('slug', slug)
    .maybeSingle();

  if (!club) {
    return NextResponse.json({ error: 'Club not found' }, { status: 404 });
  }

  // Check existing membership
  const { data: existing } = await admin
    .from('club_members')
    .select('id, status, role')
    .eq('club_id', club.id)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (existing) {
    if (existing.status === 'active') {
      return NextResponse.json({ error: 'Already a member' }, { status: 409 });
    }
    // Accept invite
    const { data, error } = await admin
      .from('club_members')
      .update({ status: 'active', joined_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select('*')
      .single();

    if (error) {
      console.error('[clubs] accept invite', error);
      return NextResponse.json({ error: 'Failed to join club' }, { status: 500 });
    }
    return NextResponse.json({ member: data });
  }

  // For public clubs, allow direct join
  if (club.visibility !== 'public') {
    return NextResponse.json({ error: 'This club is invite-only' }, { status: 403 });
  }

  // Join public club
  const { data, error } = await admin
    .from('club_members')
    .insert({
      club_id: club.id,
      user_id: auth.user.id,
      role: 'member',
      status: 'active',
      invited_by: auth.user.id,
    })
    .select('*')
    .single();

  if (error) {
    console.error('[clubs] join', error);
    return NextResponse.json({ error: 'Failed to join club' }, { status: 500 });
  }

  return NextResponse.json({ member: data }, { status: 201 });
}
