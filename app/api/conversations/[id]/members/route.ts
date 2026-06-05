import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUniversal } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const MAX_MEMBERS = 50;

/**
 * GET /api/conversations/[id]/members
 * List members of a conversation with their profiles.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const admin = getSupabaseAdmin();

  // Verify caller is a member
  const { data: myMembership } = await admin
    .from('conversation_members')
    .select('role')
    .eq('conversation_id', id)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (!myMembership) {
    return NextResponse.json({ error: 'Not a member of this conversation' }, { status: 403 });
  }

  const { data: members, error } = await admin
    .from('conversation_members')
    .select('user_id, role, joined_at, profiles(id, username, display_name, avatar_url)')
    .eq('conversation_id', id)
    .order('joined_at', { ascending: true });

  if (error) {
    console.error('[members] list', error);
    return NextResponse.json({ error: 'Failed to load members' }, { status: 500 });
  }

  return NextResponse.json({ members: members ?? [] });
}

/**
 * POST /api/conversations/[id]/members
 * Add members to an existing group. Only group admins can add.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { member_ids, member_usernames } = body;

  const admin = getSupabaseAdmin();

  // Verify caller is an admin of this group
  const { data: conv, error: convErr } = await admin
    .from('conversations')
    .select('type, created_by')
    .eq('id', id)
    .maybeSingle();

  if (convErr || !conv) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  if (conv.type !== 'group') {
    return NextResponse.json({ error: 'Can only add members to groups' }, { status: 400 });
  }

  const { data: myMembership } = await admin
    .from('conversation_members')
    .select('role')
    .eq('conversation_id', id)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (!myMembership || myMembership.role !== 'admin') {
    return NextResponse.json({ error: 'Only group admins can add members' }, { status: 403 });
  }

  // Resolve member IDs
  let newMemberIds: string[] = [];
  if (member_ids && Array.isArray(member_ids) && member_ids.length > 0) {
    newMemberIds = [...new Set(member_ids.filter(Boolean))];
  } else if (member_usernames && Array.isArray(member_usernames) && member_usernames.length > 0) {
    const usernames = member_usernames.map((u: string) => u.trim().toLowerCase()).filter(Boolean);
    const { data: profiles, error: profErr } = await admin
      .from('profiles')
      .select('id, username')
      .in('username', usernames);
    if (profErr) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
    const found = new Set((profiles ?? []).map((p) => p.username));
    const missing = usernames.filter((u: string) => !found.has(u));
    if (missing.length > 0) {
      return NextResponse.json({ error: `Users not found: ${missing.join(', ')}` }, { status: 422 });
    }
    newMemberIds = [...new Set((profiles ?? []).map((p) => p.id))];
  } else {
    return NextResponse.json({ error: 'member_ids or member_usernames required' }, { status: 400 });
  }

  // Get existing members to deduplicate
  const { data: existing } = await admin
    .from('conversation_members')
    .select('user_id')
    .eq('conversation_id', id);

  const existingIds = new Set((existing ?? []).map((m) => m.user_id));
  const toAdd = newMemberIds.filter((mid) => !existingIds.has(mid));

  if (toAdd.length === 0) {
    return NextResponse.json({ error: 'All specified users are already members' }, { status: 409 });
  }

  const totalAfter = existingIds.size + toAdd.length;
  if (totalAfter > MAX_MEMBERS) {
    return NextResponse.json({ error: `Maximum ${MAX_MEMBERS} members allowed` }, { status: 400 });
  }

  const now = new Date().toISOString();
  const rows = toAdd.map((user_id) => ({
    conversation_id: id,
    user_id,
    role: 'member' as const,
    joined_at: now,
    last_read_at: now,
  }));

  const { error: insertErr } = await admin.from('conversation_members').insert(rows);

  if (insertErr) {
    console.error('[members] add', insertErr);
    return NextResponse.json({ error: 'Failed to add members' }, { status: 500 });
  }

  return NextResponse.json({ added: toAdd.length });
}
