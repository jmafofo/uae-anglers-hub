/**
 * PATCH  /api/admin/sponsors/[id]  — update
 * DELETE /api/admin/sponsors/[id]  — remove (cascades to campaigns)
 *
 * Auth: Bearer token + profiles.is_admin.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getUserSupabase } from '@/lib/api-auth';

type Params = { params: Promise<{ id: string }> };

async function adminGuard(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return { ok: false as const, response: auth.response };
  const sb = getUserSupabase(auth.token);
  const { data: me } = await sb.from('profiles').select('is_admin').eq('id', auth.user.id).single();
  if (!me?.is_admin) {
    return { ok: false as const, response: NextResponse.json({ error: 'Admin only' }, { status: 403 }) };
  }
  return { ok: true as const, sb };
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await adminGuard(req);
  if (!guard.ok) return guard.response;
  const { id } = await params;

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  const updates: Record<string, unknown> = {};
  if (body.name        != null) updates.name        = String(body.name).trim().slice(0, 80);
  if (body.description !== undefined) updates.description = body.description == null ? null : String(body.description).slice(0, 400);
  if (body.logo_url    !== undefined) updates.logo_url    = body.logo_url;
  if (body.website     !== undefined) updates.website     = body.website;
  if (body.whatsapp    !== undefined) updates.whatsapp    = body.whatsapp;
  if (body.emirate     !== undefined) updates.emirate     = body.emirate;
  if (typeof body.is_active === 'boolean') updates.is_active = body.is_active;

  const { data, error } = await guard.sb
    .from('ad_sponsors')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();
  if (error) {
    console.error('[admin/sponsors]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  return NextResponse.json({ sponsor: data });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const guard = await adminGuard(req);
  if (!guard.ok) return guard.response;
  const { id } = await params;

  const { error } = await guard.sb.from('ad_sponsors').delete().eq('id', id);
  if (error) {
    console.error('[admin/sponsors]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
