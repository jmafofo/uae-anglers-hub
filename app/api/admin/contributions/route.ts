/**
 * GET /api/admin/contributions  — list spot proposals (admin only)
 *
 * Query params:
 *   status?  pending | approved | rejected   default 'pending'
 *   limit?   number  default 50, max 200
 *   offset?  number  default 0
 *
 * Auth: Bearer token required, and profiles.is_admin must be true.
 * RLS on spot_contributions enforces the admin check; this route
 * also checks explicitly so we can return a 403 rather than an
 * empty list.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getUserSupabase } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const sb = getUserSupabase(auth.token);

  const { data: me } = await sb
    .from('profiles')
    .select('is_admin')
    .eq('id', auth.user.id)
    .single();
  if (!me?.is_admin) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? 'pending';
  const limit  = Math.min(200, Math.max(1, Number(searchParams.get('limit')  ?? 50)));
  const offset = Math.max(0, Number(searchParams.get('offset') ?? 0));

  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'invalid status' }, { status: 400 });
  }

  const { data, error } = await sb
    .from('spot_contributions')
    .select('*, submitter:profiles!spot_contributions_user_id_fkey(username, display_name, avatar_url)')
    .eq('status', status)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[admin/contributions]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  return NextResponse.json({ contributions: data ?? [] });
}
