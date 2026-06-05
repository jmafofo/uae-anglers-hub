import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUniversal } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/clubs/:slug/members
 * List all members of a club. Requires active membership.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const { slug } = await params;
  const admin = getSupabaseAdmin();

  const { data: club } = await admin.from('clubs').select('id').eq('slug', slug).maybeSingle();
  if (!club) {
    return NextResponse.json({ error: 'Club not found' }, { status: 404 });
  }

  // Check membership
  const { data: me } = await admin
    .from('club_members')
    .select('status')
    .eq('club_id', club.id)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (!me || me.status !== 'active') {
    return NextResponse.json({ error: 'Not a member of this club' }, { status: 403 });
  }

  const { data: members, error } = await admin
    .from('club_members')
    .select('id, role, status, joined_at, invited_by, profiles(id, display_name, username, avatar_url)')
    .eq('club_id', club.id)
    .order('joined_at', { ascending: false });

  if (error) {
    console.error('[clubs] members list', error);
    return NextResponse.json({ error: 'Failed to load members' }, { status: 500 });
  }

  return NextResponse.json({
    members: (members ?? []).map((m: any) => ({
      id: m.profiles?.id,
      display_name: m.profiles?.display_name,
      username: m.profiles?.username,
      avatar_url: m.profiles?.avatar_url,
      role: m.role,
      status: m.status,
      joined_at: m.joined_at,
    })),
  });
}

/**
 * POST /api/clubs/:slug/members
 * Invite a user by username. Owner/admin only.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const { slug } = await params;
  const admin = getSupabaseAdmin();

  const { data: club } = await admin.from('clubs').select('id').eq('slug', slug).maybeSingle();
  if (!club) {
    return NextResponse.json({ error: 'Club not found' }, { status: 404 });
  }

  // Check inviter is owner/admin
  const { data: me } = await admin
    .from('club_members')
    .select('role')
    .eq('club_id', club.id)
    .eq('user_id', auth.user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (!me || !['owner', 'admin'].includes(me.role)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const username = String(body.username ?? '').trim().toLowerCase();
  if (!username) {
    return NextResponse.json({ error: 'username is required' }, { status: 400 });
  }

  // Look up user by username
  const { data: targetUser } = await admin
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Check not already a member
  const { data: existing } = await admin
    .from('club_members')
    .select('id, status')
    .eq('club_id', club.id)
    .eq('user_id', targetUser.id)
    .maybeSingle();

  if (existing) {
    if (existing.status === 'active') {
      return NextResponse.json({ error: 'User is already a member' }, { status: 409 });
    }
    // Re-invite: update the existing row
    const { error } = await admin
      .from('club_members')
      .update({ status: 'invited', invited_by: auth.user.id })
      .eq('id', existing.id);

    if (error) {
      console.error('[clubs] re-invite', error);
      return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 });
    }
    return NextResponse.json({ invited: true });
  }

  // Create invite
  const { error } = await admin.from('club_members').insert({
    club_id: club.id,
    user_id: targetUser.id,
    role: 'member',
    status: 'invited',
    invited_by: auth.user.id,
  });

  if (error) {
    console.error('[clubs] invite', error);
    return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 });
  }

  return NextResponse.json({ invited: true }, { status: 201 });
}
