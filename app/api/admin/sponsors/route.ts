/**
 * GET  /api/admin/sponsors  — list sponsors
 * POST /api/admin/sponsors  — create
 *
 * POST body (JSON):
 *   name         string  required, ≤ 80 chars
 *   description? string  ≤ 400 chars
 *   logo_url?    string  http(s)
 *   website?     string  http(s)
 *   whatsapp?    string
 *   emirate?     string
 *
 * Auth: Bearer token + profiles.is_admin.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getUserSupabase } from '@/lib/api-auth';

async function adminGuard(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return { ok: false as const, response: auth.response };
  const sb = getUserSupabase(auth.token);
  const { data: me } = await sb.from('profiles').select('is_admin').eq('id', auth.user.id).single();
  if (!me?.is_admin) {
    return { ok: false as const, response: NextResponse.json({ error: 'Admin only' }, { status: 403 }) };
  }
  return { ok: true as const, sb, userId: auth.user.id };
}

export async function GET(req: NextRequest) {
  const guard = await adminGuard(req);
  if (!guard.ok) return guard.response;

  const { data, error } = await guard.sb
    .from('ad_sponsors')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[admin/sponsors]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  return NextResponse.json({ sponsors: data ?? [] });
}

export async function POST(req: NextRequest) {
  const guard = await adminGuard(req);
  if (!guard.ok) return guard.response;

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  const name = String(body.name ?? '').trim().slice(0, 80);
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  for (const [field, value] of [
    ['logo_url', body.logo_url],
    ['website',  body.website],
  ] as const) {
    if (value != null && !/^https?:\/\//i.test(String(value))) {
      return NextResponse.json({ error: `${field} must be http(s)` }, { status: 400 });
    }
  }

  const { data, error } = await guard.sb
    .from('ad_sponsors')
    .insert({
      name,
      description: body.description == null ? null : String(body.description).slice(0, 400),
      logo_url:    body.logo_url    == null ? null : String(body.logo_url),
      website:     body.website     == null ? null : String(body.website),
      whatsapp:    body.whatsapp    == null ? null : String(body.whatsapp),
      emirate:     body.emirate     == null ? null : String(body.emirate),
      created_by:  guard.userId,
    })
    .select('*')
    .single();
  if (error) {
    console.error('[admin/sponsors]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  return NextResponse.json({ sponsor: data }, { status: 201 });
}
