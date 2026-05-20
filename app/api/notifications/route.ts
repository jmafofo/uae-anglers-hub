/**
 * GET  /api/notifications  — list unread notifications for the authenticated user
 * POST /api/notifications  — mark all as read
 * PATCH /api/notifications/:id — mark single notification as read (handled by [id]/route.ts)
 *
 * Query params (GET):
 *   limit?   number  default 20, max 100
 *   unread_only? boolean  default true
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUniversal, getUserSupabase } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 20)));
  const unreadOnly = searchParams.get('unread_only') !== 'false';

  const sb = getUserSupabase(auth.token);
  let query = sb
    .from('notifications')
    .select('*, forum_threads(title, category_id, forum_categories(name, slug))')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error('[notifications GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  // Get unread count
  const { count: unreadCount, error: countErr } = await sb
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', auth.user.id)
    .eq('is_read', false);

  if (countErr) {
    console.error('[notifications GET count]', countErr);
  }

  return NextResponse.json({
    notifications: data ?? [],
    unreadCount: unreadCount ?? 0,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const sb = getUserSupabase(auth.token);
  const { error } = await sb
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', auth.user.id)
    .eq('is_read', false);

  if (error) {
    console.error('[notifications POST mark all]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
