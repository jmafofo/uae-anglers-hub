/**
 * POST /api/notifications/subscribe
 *   Body: { category_id: string, notify_new_threads: boolean }
 *
 * GET  /api/notifications/subscribe
 *   Returns the current user's category subscriptions
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUniversal, getUserSupabase } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const sb = getUserSupabase(auth.token);
  const { data, error } = await sb
    .from('forum_category_subscriptions')
    .select('*, forum_categories(name, slug, icon)')
    .eq('user_id', auth.user.id)
    .order('created_at');

  if (error) {
    console.error('[subscriptions GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ subscriptions: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  let body: { category_id?: string; notify_new_threads?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { category_id, notify_new_threads = true } = body;
  if (!category_id) {
    return NextResponse.json({ error: 'category_id is required' }, { status: 400 });
  }

  const sb = getUserSupabase(auth.token);

  // Upsert subscription
  const { data, error } = await sb
    .from('forum_category_subscriptions')
    .upsert(
      {
        user_id: auth.user.id,
        category_id,
        notify_new_threads,
      },
      { onConflict: 'user_id, category_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('[subscriptions POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ subscription: data });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  let body: { category_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { category_id } = body;
  if (!category_id) {
    return NextResponse.json({ error: 'category_id is required' }, { status: 400 });
  }

  const sb = getUserSupabase(auth.token);
  const { error } = await sb
    .from('forum_category_subscriptions')
    .delete()
    .eq('user_id', auth.user.id)
    .eq('category_id', category_id);

  if (error) {
    console.error('[subscriptions DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
