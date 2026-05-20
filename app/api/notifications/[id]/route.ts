/**
 * PATCH /api/notifications/:id — mark a single notification as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUniversal, getUserSupabase } from '@/lib/api-auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const sb = getUserSupabase(auth.token);

  const { error } = await sb
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', auth.user.id);

  if (error) {
    console.error('[notifications PATCH]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
