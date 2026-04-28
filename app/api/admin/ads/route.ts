/**
 * GET  /api/admin/ads — list campaigns (with sponsor + counters)
 * POST /api/admin/ads — create
 *
 * POST body (JSON):
 *   sponsor_id       uuid     required
 *   placement        string   required (identify_result|spot_sidebar|home_banner|ban_banner)
 *   headline         string   required, ≤ 120 chars
 *   body?            string   ≤ 280 chars
 *   image_url?       string   http(s)
 *   cta_text?        string   ≤ 30 chars   default 'Learn more'
 *   target_url       string   required, http(s)
 *   target_species?  string[] (lowercased, matched on overlap)
 *   target_emirates? string[]
 *   cpm_aed          number   required, ≥ 0
 *   budget_aed       number   required, ≥ 0
 *   starts_at?       ISO string  default now
 *   ends_at?         ISO string
 *   priority?        number   default 0
 *
 * Auth: Bearer token + profiles.is_admin.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getUserSupabase } from '@/lib/api-auth';
import { PLACEMENTS } from '@/lib/ads';

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
    .from('ad_campaigns')
    .select('*, sponsor:ad_sponsors(id, name, logo_url, emirate)')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaigns: data ?? [] });
}

export async function POST(req: NextRequest) {
  const guard = await adminGuard(req);
  if (!guard.ok) return guard.response;

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  const sponsorId = String(body.sponsor_id ?? '');
  const placement = String(body.placement ?? '');
  const headline  = String(body.headline ?? '').trim().slice(0, 120);
  const targetUrl = String(body.target_url ?? '');
  const cpm       = Number(body.cpm_aed);
  const budget    = Number(body.budget_aed);

  if (!sponsorId) return NextResponse.json({ error: 'sponsor_id required' }, { status: 400 });
  if (!(PLACEMENTS as readonly string[]).includes(placement)) {
    return NextResponse.json({ error: `placement must be one of ${PLACEMENTS.join(', ')}` }, { status: 400 });
  }
  if (!headline)  return NextResponse.json({ error: 'headline required' }, { status: 400 });
  if (!/^https?:\/\//i.test(targetUrl)) {
    return NextResponse.json({ error: 'target_url must be http(s)' }, { status: 400 });
  }
  if (!Number.isFinite(cpm) || cpm < 0)       return NextResponse.json({ error: 'cpm_aed required (≥ 0)' }, { status: 400 });
  if (!Number.isFinite(budget) || budget < 0) return NextResponse.json({ error: 'budget_aed required (≥ 0)' }, { status: 400 });

  const targetSpecies = Array.isArray(body.target_species)
    ? body.target_species.map(s => String(s).toLowerCase()).slice(0, 50)
    : [];
  const targetEmirates = Array.isArray(body.target_emirates)
    ? body.target_emirates.map(String).slice(0, 7)
    : [];

  const { data, error } = await guard.sb
    .from('ad_campaigns')
    .insert({
      sponsor_id:      sponsorId,
      placement,
      headline,
      body:            body.body == null ? null : String(body.body).slice(0, 280),
      image_url:       body.image_url == null ? null : String(body.image_url),
      cta_text:        body.cta_text == null ? 'Learn more' : String(body.cta_text).slice(0, 30),
      target_url:      targetUrl,
      target_species:  targetSpecies,
      target_emirates: targetEmirates,
      cpm_aed:         cpm,
      budget_aed:      budget,
      starts_at:       body.starts_at == null ? new Date().toISOString() : new Date(String(body.starts_at)).toISOString(),
      ends_at:         body.ends_at   == null ? null : new Date(String(body.ends_at)).toISOString(),
      priority:        body.priority  == null ? 0    : Number(body.priority),
      created_by:      guard.userId,
    })
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaign: data }, { status: 201 });
}
