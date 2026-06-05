import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUniversal } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * DELETE /api/clubs/:slug/members/:userId
 * Remove a member from the club, or leave the club.
 * - Owners can remove anyone
 * - Admins can remove members (not other admins or owners)
 * - Members can remove themselves (leave)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; userId: string }> }
) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const { slug, userId: targetUserId } = await params;
  const admin = getSupabaseAdmin();

  const { data: club } = await admin.from('clubs').select('id, created_by').eq('slug', slug).maybeSingle();
  if (!club) {
    return NextResponse.json({ error: 'Club not found' }, { status: 404 });
  }

  const { data: me } = await admin
    .from('club_members')
    .select('role')
    .eq('club_id', club.id)
    .eq('user_id', auth.user.id)
    .eq('status', 'active')
    .maybeSingle();

  const isSelf = auth.user.id === targetUserId;
  const isOwner = me?.role === 'owner';
  const isAdmin = me?.role === 'admin';

  if (!isSelf && !isOwner && !isAdmin) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  // If admin removing someone, they can't remove owners or other admins
  if (isAdmin && !isSelf) {
    const { data: target } = await admin
      .from('club_members')
      .select('role')
      .eq('club_id', club.id)
      .eq('user_id', targetUserId)
      .maybeSingle();
    if (target && ['owner', 'admin'].includes(target.role)) {
      return NextResponse.json({ error: 'Admins cannot remove owners or other admins' }, { status: 403 });
    }
  }

  // Cannot remove the owner
  if (targetUserId === club.created_by && !isSelf) {
    return NextResponse.json({ error: 'Cannot remove the club owner' }, { status: 403 });
  }

  const { error } = await admin
    .from('club_members')
    .delete()
    .eq('club_id', club.id)
    .eq('user_id', targetUserId);

  if (error) {
    console.error('[clubs] remove member', error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/**
 * PATCH /api/clubs/:slug/members/:userId
 * Update a member's role. Owner only.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; userId: string }> }
) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const { slug, userId: targetUserId } = await params;
  const admin = getSupabaseAdmin();

  const { data: club } = await admin.from('clubs').select('id, created_by').eq('slug', slug).maybeSingle();
  if (!club) {
    return NextResponse.json({ error: 'Club not found' }, { status: 404 });
  }

  // Only owner can change roles
  if (club.created_by !== auth.user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const role = String(body.role ?? '');
  if (!['owner', 'admin', 'member'].includes(role)) {
    return NextResponse.json({ error: 'role must be owner, admin, or member' }, { status: 400 });
  }

  // Cannot change own role from owner (would orphan the club)
  if (targetUserId === auth.user.id && role !== 'owner') {
    return NextResponse.json({ error: 'Cannot demote yourself from owner' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('club_members')
    .update({ role })
    .eq('club_id', club.id)
    .eq('user_id', targetUserId)
    .eq('status', 'active')
    .select('*')
    .single();

  if (error) {
    console.error('[clubs] update role', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }

  return NextResponse.json({ member: data });
}
