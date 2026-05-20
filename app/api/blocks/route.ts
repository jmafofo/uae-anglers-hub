/**
 * GET    /api/blocks            — list users I've blocked
 * POST   /api/blocks            — block a user by id OR username
 *                                 Body: { user_id?: uuid, username?: string }
 * DELETE /api/blocks?user_id=…  — unblock by id
 *
 * Auth: cookie session (web) or Bearer token (mobile).
 *
 * Note: client-side reply filtering on the thread page uses the
 * GET list. Adding cross-page enforcement (category + all-threads
 * lists) is a follow-up.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUniversal, getUserSupabase } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const sb = getUserSupabase(auth.token);
  const { data, error } = await sb
    .from('blocked_users')
    .select('blocked_id, created_at, blocked:profiles!blocked_users_blocked_id_fkey(username, display_name, avatar_url)')
    .eq('blocker_id', auth.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[blocks GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ blocks: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  let body: { user_id?: unknown; username?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const sb = getUserSupabase(auth.token);

  // Resolve username → user_id if needed
  let blockedId: string | null = null;
  if (typeof body.user_id === 'string' && /^[0-9a-f-]{36}$/i.test(body.user_id)) {
    blockedId = body.user_id;
  } else if (typeof body.username === 'string' && body.username.trim()) {
    const username = body.username.trim().replace(/^@/, '').toLowerCase();
    const { data: target } = await sb
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();
    if (!target) {
      return NextResponse.json({ error: `No user with username "${username}"` }, { status: 404 });
    }
    blockedId = target.id;
  } else {
    return NextResponse.json({ error: 'Provide user_id or username' }, { status: 400 });
  }

  if (blockedId === auth.user.id) {
    return NextResponse.json({ error: "You can't block yourself" }, { status: 400 });
  }

  const { error } = await sb
    .from('blocked_users')
    .insert({ blocker_id: auth.user.id, blocked_id: blockedId });

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Already blocked' }, { status: 409 });
    }
    console.error('[blocks POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, blocked_id: blockedId }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('user_id');
  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) {
    return NextResponse.json({ error: 'user_id query param required (uuid)' }, { status: 400 });
  }

  const sb = getUserSupabase(auth.token);
  const { error } = await sb
    .from('blocked_users')
    .delete()
    .eq('blocker_id', auth.user.id)
    .eq('blocked_id', userId);

  if (error) {
    console.error('[blocks DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
