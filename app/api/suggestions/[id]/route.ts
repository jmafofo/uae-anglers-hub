/**
 * DELETE /api/suggestions/:id
 * PATCH /api/suggestions/:id
 *
 * Delete own suggestion (or admin delete any).
 * Admin-only status update.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUniversal } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const VALID_STATUS = ['pending', 'under_review', 'planned', 'implemented', 'declined'];

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const admin = getSupabaseAdmin();

  const { data: suggestion } = await admin
    .from('suggestions')
    .select('id, user_id')
    .eq('id', id)
    .maybeSingle();

  if (!suggestion) {
    return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
  }

  // Allow author or admin to delete
  const { data: profile } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('id', auth.user.id)
    .maybeSingle();

  const isAdmin = !!profile?.is_admin;
  const isAuthor = suggestion.user_id === auth.user.id;

  if (!isAuthor && !isAdmin) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const { error } = await admin.from('suggestions').delete().eq('id', id);
  if (error) {
    console.error('[suggestions/delete]', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const admin = getSupabaseAdmin();

  const { data: profile } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const status = body.status;
  if (!VALID_STATUS.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const { error } = await admin
    .from('suggestions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('[suggestions/patch]', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }

  return NextResponse.json({ updated: true });
}
