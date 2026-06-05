import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUniversal } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/follows?user_id=<uuid>
 * Returns follower count, following count, and whether the
 * authenticated user follows the target user.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const targetId = searchParams.get('user_id');
  if (!targetId) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const { count: followerCount } = await admin
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', targetId);

  const { count: followingCount } = await admin
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', targetId);

  const { data: followRow } = await admin
    .from('follows')
    .select('id')
    .eq('follower_id', auth.user.id)
    .eq('following_id', targetId)
    .maybeSingle();

  return NextResponse.json({
    follower_count: followerCount ?? 0,
    following_count: followingCount ?? 0,
    is_following: !!followRow,
  });
}

/**
 * POST /api/follows
 * Follow a user by user_id or username.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({}));
  const { user_id, username } = body;

  const admin = getSupabaseAdmin();
  let targetId: string | undefined = user_id;

  if (!targetId && username) {
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .maybeSingle();
    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    targetId = profile.id;
  }

  if (!targetId) {
    return NextResponse.json({ error: 'user_id or username required' }, { status: 400 });
  }
  if (targetId === auth.user.id) {
    return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
  }

  const { error } = await admin
    .from('follows')
    .insert({ follower_id: auth.user.id, following_id: targetId })
    .select()
    .single();

  if (error) {
    if (error.message.includes('duplicate')) {
      return NextResponse.json({ error: 'Already following' }, { status: 409 });
    }
    console.error('[follows] insert', error);
    return NextResponse.json({ error: 'Failed to follow' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/follows
 * Unfollow a user by user_id or username.
 */
export async function DELETE(req: NextRequest) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({}));
  const { user_id, username } = body;

  const admin = getSupabaseAdmin();
  let targetId: string | undefined = user_id;

  if (!targetId && username) {
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .maybeSingle();
    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    targetId = profile.id;
  }

  if (!targetId) {
    return NextResponse.json({ error: 'user_id or username required' }, { status: 400 });
  }

  const { error } = await admin
    .from('follows')
    .delete()
    .eq('follower_id', auth.user.id)
    .eq('following_id', targetId);

  if (error) {
    console.error('[follows] delete', error);
    return NextResponse.json({ error: 'Failed to unfollow' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
