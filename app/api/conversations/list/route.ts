/**
 * GET /api/conversations/list
 *
 * Returns all conversations the authenticated user is a member of,
 * plus member profiles for display-name rendering.
 *
 * Uses the admin client to bypass the recursive RLS policy on
 * conversation_members.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUniversal } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const admin = getSupabaseAdmin();

  // 1. Get the user's memberships + conversation data
  const { data: memberships, error: mErr } = await admin
    .from('conversation_members')
    .select('conversation_id, last_read_at, role, conversations(id, type, name, last_message_at, created_by)')
    .eq('user_id', auth.user.id);

  if (mErr) {
    console.error('[conversations/list] memberships', mErr);
    return NextResponse.json({ error: 'Failed to load conversations' }, { status: 500 });
  }

  const rows = memberships ?? [];
  const convs = rows
    .map((r: unknown) => {
      const row = r as { conversation_id: string; last_read_at: string; conversations: Array<{ id: string; type: 'dm' | 'group'; name: string | null; last_message_at: string }> | null };
      const conv = Array.isArray(row.conversations) ? row.conversations[0] : row.conversations;
      return conv ? { ...conv, last_read_at: row.last_read_at, my_role: (row as { role?: string }).role ?? 'member' } : null;
    })
    .filter((c): c is { id: string; type: 'dm' | 'group'; name: string | null; last_message_at: string; last_read_at: string; created_by: string | null; my_role: string } => Boolean(c));

  if (convs.length === 0) {
    return NextResponse.json({ conversations: [] });
  }

  const convIds = convs.map((c) => c.id);

  // 2. Get all members for these conversations (with profile info)
  const { data: members, error: membersErr } = await admin
    .from('conversation_members')
    .select('conversation_id, user_id, profiles(id, username, display_name)')
    .in('conversation_id', convIds);

  if (membersErr) {
    console.error('[conversations/list] members', membersErr);
    return NextResponse.json({ error: 'Failed to load members' }, { status: 500 });
  }

  // Build profile map keyed by user_id
  const profMap = new Map<string, { username: string; display_name: string | null }>();
  for (const m of members ?? []) {
    const p = (m as unknown as { profiles?: { id: string; username: string; display_name: string | null } }).profiles;
    if (p && !profMap.has(p.id)) {
      profMap.set(p.id, { username: p.username, display_name: p.display_name });
    }
  }

  // Build response views
  const views = convs.map((c) => {
    const convMembers = (members ?? []).filter(
      (m) => (m as unknown as { conversation_id: string }).conversation_id === c.id
    ) as unknown as Array<{ user_id: string; profiles?: { username: string; display_name: string | null } }>;

    if (c.type === 'dm') {
      const other = convMembers.find((m) => m.user_id !== auth.user.id);
      return {
        id: c.id,
        type: 'dm' as const,
        display_name: other?.profiles?.display_name ?? other?.profiles?.username ?? 'Conversation',
        last_message_at: c.last_message_at,
        my_last_read_at: c.last_read_at,
        other_user_id: other?.user_id ?? null,
        created_by: c.created_by,
        my_role: c.my_role,
      };
    }

    return {
      id: c.id,
      type: 'group' as const,
      display_name: c.name ?? 'Group chat',
      last_message_at: c.last_message_at,
      my_last_read_at: c.last_read_at,
      other_user_id: null,
      created_by: c.created_by,
      my_role: c.my_role,
    };
  }).sort((a, b) => b.last_message_at.localeCompare(a.last_message_at));

  return NextResponse.json({ conversations: views, profiles: Object.fromEntries(profMap) });
}
