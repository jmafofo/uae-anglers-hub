/**
 * POST /api/conversations/group
 *
 * Create a new group conversation and invite members.
 *
 * Body (JSON):
 *   name              string   required, ≤ 80 chars
 *   member_usernames  string[] required, at least one other user
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUniversal } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const MAX_NAME = 80;
const MAX_MEMBERS = 50;

export async function POST(req: NextRequest) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  let body: { name?: string; member_ids?: string[]; member_usernames?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const name = (body.name ?? '').trim();
  let memberIds: string[] = [];
  const admin = getSupabaseAdmin();

  if (body.member_ids && body.member_ids.length > 0) {
    memberIds = [...new Set(body.member_ids.filter(Boolean))];
  } else if (body.member_usernames && body.member_usernames.length > 0) {
    const usernames = body.member_usernames.map((u) => u.trim().toLowerCase()).filter(Boolean);
    const { data: profiles, error: profErr } = await admin
      .from('profiles')
      .select('id, username')
      .in('username', usernames);
    if (profErr) {
      console.error('[group create] profile lookup', profErr);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
    const foundUsernames = new Set((profiles ?? []).map((p) => p.username));
    const missing = usernames.filter((u) => !foundUsernames.has(u));
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `User${missing.length > 1 ? 's' : ''} not found: ${missing.join(', ')}` },
        { status: 422 }
      );
    }
    memberIds = [...new Set((profiles ?? []).map((p) => p.id))];
  }

  if (!name) {
    return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
  }
  if (name.length > MAX_NAME) {
    return NextResponse.json({ error: `Group name must be ${MAX_NAME} characters or less` }, { status: 400 });
  }
  if (memberIds.length === 0) {
    return NextResponse.json({ error: 'At least one member is required' }, { status: 400 });
  }
  if (memberIds.length > MAX_MEMBERS) {
    return NextResponse.json({ error: `Maximum ${MAX_MEMBERS} members allowed` }, { status: 400 });
  }

  // Use admin client to bypass RLS — the conversation_members INSERT
  // policy references conversation_members itself, which causes
  // infinite recursion when evaluated through a normal user client.
  const { data: conv, error: convErr } = await admin
    .from('conversations')
    .insert({ type: 'group', name, created_by: auth.user.id })
    .select('id')
    .single();

  if (convErr || !conv) {
    console.error('[group create] conversation insert', convErr);
    return NextResponse.json(
      { error: convErr?.message ?? 'Could not create group' },
      { status: 500 }
    );
  }

  const now = new Date().toISOString();
  const memberRows = [
    { conversation_id: conv.id, user_id: auth.user.id, role: 'admin', joined_at: now, last_read_at: now },
    ...memberIds
      .filter((id) => id !== auth.user.id)
      .map((id) => ({
        conversation_id: conv.id,
        user_id: id,
        role: 'member' as const,
        joined_at: now,
        last_read_at: now,
      })),
  ];

  const { error: memErr } = await admin.from('conversation_members').insert(memberRows);

  if (memErr) {
    console.error('[group create] members insert', memErr);
    await admin.from('conversations').delete().eq('id', conv.id);
    return NextResponse.json(
      { error: memErr?.message ?? 'Could not add members' },
      { status: 500 }
    );
  }

  return NextResponse.json({ conversation_id: conv.id });
}
