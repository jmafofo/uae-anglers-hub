import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUniversal } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * POST /api/posts/:id/like
 * Like a post (idempotent — safe to call multiple times).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const admin = getSupabaseAdmin();

  const { error } = await admin
    .from('post_likes')
    .insert({ post_id: id, user_id: auth.user.id })
    .select()
    .maybeSingle();

  if (error && error.code !== '23505') { // 23505 = unique violation (already liked)
    console.error('[like POST]', error);
    return NextResponse.json({ error: 'Failed to like' }, { status: 500 });
  }

  return NextResponse.json({ liked: true });
}

/**
 * DELETE /api/posts/:id/like
 * Unlike a post (idempotent — safe to call multiple times).
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const admin = getSupabaseAdmin();

  const { error } = await admin
    .from('post_likes')
    .delete()
    .eq('post_id', id)
    .eq('user_id', auth.user.id);

  if (error) {
    console.error('[like DELETE]', error);
    return NextResponse.json({ error: 'Failed to unlike' }, { status: 500 });
  }

  return NextResponse.json({ liked: false });
}
