import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUniversal } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/posts/:id/comments
 * List comments on a post with user profiles.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from('post_comments')
    .select(`
      id, post_id, user_id, body, created_at,
      profiles(id, username, display_name, avatar_url)
    `)
    .eq('post_id', id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 });
  }

  return NextResponse.json({ comments: data ?? [] });
}

/**
 * POST /api/posts/:id/comments
 * Add a comment to a post.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { body: text } = body;

  if (!text?.trim()) {
    return NextResponse.json({ error: 'Comment body is required' }, { status: 400 });
  }
  if (text.length > 1000) {
    return NextResponse.json({ error: 'Comment must be 1000 characters or less' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from('post_comments')
    .insert({ post_id: id, user_id: auth.user.id, body: text.trim() })
    .select('id, post_id, user_id, body, created_at, profiles(id, username, display_name, avatar_url)')
    .single();

  if (error) {
    console.error('[comments] create', error);
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }

  return NextResponse.json({ comment: data }, { status: 201 });
}
