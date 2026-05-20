/**
 * POST /api/suggestions/:id/vote   → upvote
 * DELETE /api/suggestions/:id/vote → remove vote
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUniversal } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from('suggestion_votes')
    .insert({ suggestion_id: id, user_id: auth.user.id });

  if (error) {
    // 23505 = unique violation (already voted)
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Already voted' }, { status: 409 });
    }
    console.error('[suggestions/vote]', error);
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
  }

  return NextResponse.json({ voted: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from('suggestion_votes')
    .delete()
    .eq('suggestion_id', id)
    .eq('user_id', auth.user.id);

  if (error) {
    console.error('[suggestions/unvote]', error);
    return NextResponse.json({ error: 'Failed to remove vote' }, { status: 500 });
  }

  return NextResponse.json({ unvoted: true });
}
