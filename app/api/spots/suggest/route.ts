/**
 * POST /api/spots/suggest  — propose a brand-new fishing spot
 * GET  /api/spots/suggest  — list the caller's own proposals
 *
 * Use this when a waypoint POST to /api/spots/[slug]/waypoints
 * returns 422 ("outside this spot") — the location is genuinely
 * new and needs an admin review before it becomes a canonical spot.
 *
 * POST body (JSON):
 *   name           string  required, ≤ 80 chars
 *   latitude       number  required, UAE range
 *   longitude      number  required, UAE range
 *   emirate?       string
 *   access_type?   string
 *   description?   string  ≤ 1000 chars
 *   photo_url?     string  http(s)
 *   target_species? string[]
 *
 * Rate limit: 5 proposals per user per hour.
 *
 * Auth: Bearer token required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getUserSupabase } from '@/lib/api-auth';

const MAX_PER_HOUR = 5;

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const sb = getUserSupabase(auth.token);
  const { data, error } = await sb
    .from('spot_contributions')
    .select('*')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contributions: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const name = String(body.name ?? '').trim().slice(0, 80);
  const lat = Number(body.latitude);
  const lon = Number(body.longitude);
  const emirate = body.emirate == null ? null : String(body.emirate);
  const accessType = body.access_type == null ? null : String(body.access_type);
  const description = body.description == null
    ? null
    : String(body.description).slice(0, 1000);
  const photoUrl = body.photo_url == null ? null : String(body.photo_url);
  const targetSpecies = Array.isArray(body.target_species)
    ? body.target_species.map(String).slice(0, 20)
    : [];

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
  if (!Number.isFinite(lat) || lat < 22 || lat > 27) {
    return NextResponse.json({ error: 'latitude out of UAE range' }, { status: 400 });
  }
  if (!Number.isFinite(lon) || lon < 51 || lon > 57) {
    return NextResponse.json({ error: 'longitude out of UAE range' }, { status: 400 });
  }
  if (photoUrl && !/^https?:\/\//i.test(photoUrl)) {
    return NextResponse.json({ error: 'photo_url must be http(s)' }, { status: 400 });
  }

  const sb = getUserSupabase(auth.token);

  const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await sb
    .from('spot_contributions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', auth.user.id)
    .gte('created_at', hourAgo);
  if ((count ?? 0) >= MAX_PER_HOUR) {
    return NextResponse.json(
      { error: `Rate limit — max ${MAX_PER_HOUR} proposals per hour` },
      { status: 429 },
    );
  }

  const { data, error } = await sb
    .from('spot_contributions')
    .insert({
      user_id: auth.user.id,
      name,
      emirate,
      latitude: lat,
      longitude: lon,
      access_type: accessType,
      description,
      photo_url: photoUrl,
      target_species: targetSpecies,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contribution: data }, { status: 201 });
}
