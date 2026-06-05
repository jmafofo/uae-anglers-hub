import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUniversal } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/posts/:id
 * Single post detail with media, likes count, comments, and has_liked.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthUniversal(req);
  const userId = auth.ok ? auth.user.id : null;
  const { id } = await params;

  const admin = getSupabaseAdmin();

  const { data: post, error } = await admin
    .from('posts')
    .select(`
      id, user_id, caption, created_at,
      profiles!inner(id, username, display_name, avatar_url),
      post_media(id, media_url, media_type, sort_order)
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Failed to load post' }, { status: 500 });
  }
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  // Counts
  const [{ count: likesCount }, { count: commentsCount }, { data: viewData }] = await Promise.all([
    admin.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', id),
    admin.from('post_comments').select('*', { count: 'exact', head: true }).eq('post_id', id).is('deleted_at', null),
    admin.from('post_views').select('*', { count: 'exact', head: true }).eq('post_id', id),
  ]);

  let hasLiked = false;
  if (userId) {
    const { data: like } = await admin
      .from('post_likes')
      .select('post_id')
      .eq('post_id', id)
      .eq('user_id', userId)
      .maybeSingle();
    hasLiked = !!like;
  }

  return NextResponse.json({
    id: post.id,
    user_id: post.user_id,
    caption: post.caption,
    created_at: post.created_at,
    profile: post.profiles,
    media: (post.post_media ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
    likes_count: likesCount ?? 0,
    comments_count: commentsCount ?? 0,
    views_count: viewData ?? 0,
    has_liked: hasLiked,
  });
}

/**
 * DELETE /api/posts/:id
 * Soft-delete own post.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const admin = getSupabaseAdmin();

  const { data: post } = await admin
    .from('posts')
    .select('user_id')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }
  if (post.user_id !== auth.user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const { error } = await admin
    .from('posts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }

  // Decrement posts_count
  await admin.rpc('decrement_posts_count', { p_user_id: post.user_id });

  return NextResponse.json({ success: true });
}
