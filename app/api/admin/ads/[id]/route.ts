/**
 * PATCH  /api/admin/ads/[id]  — update campaign
 * DELETE /api/admin/ads/[id]  — remove (cascades to impressions/clicks)
 *
 * Auth: Bearer token + profiles.is_admin.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getUserSupabase } from '@/lib/api-auth';
import { PLACEMENTS } from '@/lib/ads';

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
  if (body.placement != null) {
    const p = String(body.placement);
    if (!(PLACEMENTS as readonly string[]).includes(p)) {
      return NextResponse.json({ error: 'invalid placement' }, { status: 400 });
    }
    updates.placement = p;
  }
  if (body.headline   != null) updates.headline   = String(body.headline).trim().slice(0, 120);
  if (body.body       !== undefined) updates.body       = body.body == null ? null : String(body.body).slice(0, 280);
  if (body.image_url  !== undefined) updates.image_url  = body.image_url;
  if (body.cta_text   != null) updates.cta_text   = String(body.cta_text).slice(0, 30);
  if (body.target_url != null) {
    const u = String(body.target_url);
    if (!/^https?:\/\//i.test(u)) {
      return NextResponse.json({ error: 'target_url must be http(s)' }, { status: 400 });
    }
    updates.target_url = u;
  }
  if (Array.isArray(body.target_species))  updates.target_species  = body.target_species.map(s => String(s).toLowerCase()).slice(0, 50);
  if (Array.isArray(body.target_emirates)) updates.target_emirates = body.target_emirates.map(String).slice(0, 7);
  if (body.cpm_aed    != null) updates.cpm_aed    = Number(body.cpm_aed);
  if (body.budget_aed != null) updates.budget_aed = Number(body.budget_aed);
  if (body.starts_at  != null) updates.starts_at  = new Date(String(body.starts_at)).toISOString();
  if (body.ends_at    !== undefined) updates.ends_at = body.ends_at == null ? null : new Date(String(body.ends_at)).toISOString();
  if (typeof body.is_active === 'boolean') updates.is_active = body.is_active;
  if (body.priority   != null) updates.priority   = Number(body.priority);

  const { data, error } = await guard.sb
    .from('ad_campaigns')
    .update(updates)
    .eq('id', id)
    .select('*, sponsor:ad_sponsors(id, name, logo_url, emirate)')
    .single();
  if (error) {
    console.error('[admin/ads]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  return NextResponse.json({ campaign: data });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const guard = await adminGuard(req);
  if (!guard.ok) return guard.response;
  const { id } = await params;

  const { error } = await guard.sb.from('ad_campaigns').delete().eq('id', id);
  if (error) {
    console.error('[admin/ads]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
