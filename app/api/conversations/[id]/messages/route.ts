/**
 * POST /api/conversations/:id/messages
 *
 * Sends a message in a conversation.
 * Uses the admin client to bypass recursive RLS.
 * Verifies the user is actually a member before inserting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUniversal } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing conversation id' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Verify membership
  const { data: membership } = await admin
    .from('conversation_members')
    .select('conversation_id')
    .eq('conversation_id', id)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: 'Not a member' }, { status: 403 });
  }

  const { data, error } = await admin
    .from('messages')
    .select('id, conversation_id, sender_id, body, created_at, edited_at, deleted_at, moderation_status')
    .eq('conversation_id', id)
    .order('created_at')
    .limit(200);

  if (error) {
    console.error('[conversations/messages] load', error);
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 });
  }

  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing conversation id' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const text = String(body.body ?? '').trim();
  if (!text || text.length < 1 || text.length > 4000) {
    return NextResponse.json({ error: 'Message must be 1–4000 characters' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Verify membership
  const { data: membership } = await admin
    .from('conversation_members')
    .select('conversation_id')
    .eq('conversation_id', id)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: 'Not a member of this conversation' }, { status: 403 });
  }

  const { data, error } = await admin
    .from('messages')
    .insert({
      conversation_id: id,
      sender_id: auth.user.id,
      body: text,
    })
    .select('id, conversation_id, sender_id, body, created_at, edited_at, deleted_at, moderation_status')
    .single();

  if (error) {
    console.error('[conversations/messages] insert', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: data });
}
