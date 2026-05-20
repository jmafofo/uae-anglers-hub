/**
 * PATCH /api/conversations/:id/messages/:messageId
 * DELETE /api/conversations/:id/messages/:messageId
 *
 * Edit or soft-delete a message. Uses admin client to bypass RLS.
 * Only the original sender can edit/delete their own message.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUniversal } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const { id, messageId } = await params;
  if (!id || !messageId) {
    return NextResponse.json({ error: 'Missing ids' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const text = String(body.body ?? '').trim();
  if (!text || text.length < 1 || text.length > 4000) {
    return NextResponse.json({ error: 'Message must be 1–4000 characters' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Verify sender
  const { data: msg } = await admin
    .from('messages')
    .select('id, sender_id')
    .eq('id', messageId)
    .eq('conversation_id', id)
    .maybeSingle();

  if (!msg) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  }
  if (msg.sender_id !== auth.user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const { data, error } = await admin
    .from('messages')
    .update({ body: text })
    .eq('id', messageId)
    .select('id, conversation_id, sender_id, body, created_at, edited_at, deleted_at, moderation_status')
    .single();

  if (error) {
    console.error('[messages/patch]', error);
    return NextResponse.json({ error: 'Failed to edit message' }, { status: 500 });
  }

  return NextResponse.json({ message: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const { id, messageId } = await params;
  if (!id || !messageId) {
    return NextResponse.json({ error: 'Missing ids' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const { data: msg } = await admin
    .from('messages')
    .select('id, sender_id')
    .eq('id', messageId)
    .eq('conversation_id', id)
    .maybeSingle();

  if (!msg) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  }
  if (msg.sender_id !== auth.user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const { error } = await admin
    .from('messages')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', messageId);

  if (error) {
    console.error('[messages/delete]', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
