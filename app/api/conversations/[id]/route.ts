/**
 * DELETE /api/conversations/:id
 *
 * Permissions:
 *   - Group creator or admin  → deletes the entire conversation (cascade)
 *   - DM participant or regular group member → leaves (deletes own member row)
 *
 * Uses the admin client to bypass recursive RLS on conversation_members.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUniversal } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function DELETE(
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

  // 1. Fetch conversation + user's membership
  const [{ data: conv }, { data: myMember }] = await Promise.all([
    admin.from('conversations').select('id, type, created_by').eq('id', id).maybeSingle(),
    admin
      .from('conversation_members')
      .select('conversation_id, user_id, role')
      .eq('conversation_id', id)
      .eq('user_id', auth.user.id)
      .maybeSingle(),
  ]);

  if (!conv) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  if (!myMember) {
    return NextResponse.json({ error: 'Not a member' }, { status: 403 });
  }

  const canDeleteGroup =
    conv.type === 'group' &&
    (conv.created_by === auth.user.id || (myMember as { role?: string }).role === 'admin');

  // 2. Full delete (creator/admin of a group)
  if (canDeleteGroup) {
    const { error } = await admin.from('conversations').delete().eq('id', id);
    if (error) {
      console.error('[conversations/delete] full delete', error);
      return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
    }
    return NextResponse.json({ deleted: true });
  }

  // 3. Leave (remove own membership row)
  const { error } = await admin
    .from('conversation_members')
    .delete()
    .eq('conversation_id', id)
    .eq('user_id', auth.user.id);

  if (error) {
    console.error('[conversations/delete] leave', error);
    return NextResponse.json({ error: 'Failed to leave conversation' }, { status: 500 });
  }

  return NextResponse.json({ left: true });
}
