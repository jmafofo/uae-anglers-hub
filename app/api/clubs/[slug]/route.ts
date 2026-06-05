import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUniversal } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/clubs/:slug
 * Get club detail with member list.
 * Requires authentication for private clubs.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await requireAuthUniversal(req);
  const userId = auth.ok ? auth.user.id : null;
  const { slug } = await params;

  const admin = getSupabaseAdmin();

  const { data: club, error } = await admin
    .from('clubs')
    .select('*, profiles!inner(display_name, username, avatar_url)')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('[clubs] detail', error);
    return NextResponse.json({ error: 'Failed to load club' }, { status: 500 });
  }
  if (!club) {
    return NextResponse.json({ error: 'Club not found' }, { status: 404 });
  }

  // For private clubs, check membership
  if (club.visibility === 'private') {
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data: membership } = await admin
      .from('club_members')
      .select('status, role')
      .eq('club_id', club.id)
      .eq('user_id', userId)
      .maybeSingle();

    if (!membership || membership.status !== 'active') {
      return NextResponse.json({ error: 'Not a member of this club' }, { status: 403 });
    }
  }

  // Get members
  const { data: members, error: membersErr } = await admin
    .from('club_members')
    .select('id, role, status, joined_at, profiles(id, display_name, username, avatar_url)')
    .eq('club_id', club.id)
    .eq('status', 'active')
    .order('joined_at', { ascending: false });

  if (membersErr) {
    console.error('[clubs] members', membersErr);
  }

  // Check if current user is a member and what their role is
  let userRole: string | null = null;
  let userStatus: string | null = null;
  if (userId) {
    const { data: me } = await admin
      .from('club_members')
      .select('role, status')
      .eq('club_id', club.id)
      .eq('user_id', userId)
      .maybeSingle();
    if (me) {
      userRole = me.role;
      userStatus = me.status;
    }
  }

  return NextResponse.json({
    club: {
      id: club.id,
      slug: club.slug,
      name: club.name,
      description: club.description,
      logo_url: club.logo_url,
      visibility: club.visibility,
      member_count: club.member_count,
      created_at: club.created_at,
      created_by: {
        id: club.created_by,
        display_name: club.profiles?.display_name,
        username: club.profiles?.username,
        avatar_url: club.profiles?.avatar_url,
      },
    },
    members: (members ?? []).map((m: any) => ({
      id: m.profiles?.id,
      display_name: m.profiles?.display_name,
      username: m.profiles?.username,
      avatar_url: m.profiles?.avatar_url,
      role: m.role,
      joined_at: m.joined_at,
    })),
    me: userId ? { role: userRole, status: userStatus } : null,
  });
}

/**
 * PATCH /api/clubs/:slug
 * Update club details (owner/admin only).
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const { slug } = await params;
  const admin = getSupabaseAdmin();

  // Get club and check auth
  const { data: club } = await admin.from('clubs').select('id, created_by').eq('slug', slug).maybeSingle();
  if (!club) {
    return NextResponse.json({ error: 'Club not found' }, { status: 404 });
  }

  const { data: membership } = await admin
    .from('club_members')
    .select('role')
    .eq('club_id', club.id)
    .eq('user_id', auth.user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name.length < 2 || name.length > 80) {
      return NextResponse.json({ error: 'Name must be 2–80 characters' }, { status: 400 });
    }
    updates.name = name;
  }
  if (body.description !== undefined) updates.description = String(body.description).trim() || null;
  if (body.logo_url !== undefined) updates.logo_url = body.logo_url ? String(body.logo_url) : null;
  if (body.visibility !== undefined) {
    const v = String(body.visibility);
    if (!['private', 'public'].includes(v)) {
      return NextResponse.json({ error: 'visibility must be private or public' }, { status: 400 });
    }
    updates.visibility = v;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
  }

  const { data, error } = await admin.from('clubs').update(updates).eq('id', club.id).select('*').single();

  if (error) {
    console.error('[clubs] update', error);
    return NextResponse.json({ error: 'Failed to update club' }, { status: 500 });
  }

  return NextResponse.json({ club: data });
}

/**
 * DELETE /api/clubs/:slug
 * Delete club (owner only).
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const { slug } = await params;
  const admin = getSupabaseAdmin();

  const { data: club } = await admin.from('clubs').select('id, created_by').eq('slug', slug).maybeSingle();
  if (!club) {
    return NextResponse.json({ error: 'Club not found' }, { status: 404 });
  }

  if (club.created_by !== auth.user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const { error } = await admin.from('clubs').delete().eq('id', club.id);

  if (error) {
    console.error('[clubs] delete', error);
    return NextResponse.json({ error: 'Failed to delete club' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
