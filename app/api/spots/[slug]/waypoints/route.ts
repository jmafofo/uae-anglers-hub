/**
 * GET  /api/spots/[slug]/waypoints  — list waypoints for a spot
 * POST /api/spots/[slug]/waypoints  — drop a new pin within a spot
 *
 * GET query params:
 *   kind?   productive | rocky | snag | dead | launch | parking | mixed
 *   include_pending?  'true'  — include this user's own unverified pins
 *                              (requires Bearer token; verified + non-private
 *                               public pins are always returned)
 *
 * POST body (JSON):
 *   latitude        number   required
 *   longitude       number   required
 *   kind            string   required — see allowed list above
 *   label?          string   ≤ 280 chars
 *   photo_url?      string
 *   target_species? string[]
 *   precision?      'exact' | '100m' | '500m'  default 'exact'
 *   is_private?     boolean  default false
 *   video_url?    string   http(s) — link to the video this pin is featured in
 *   source?         'web' | 'app' | 'ocean_sentinel'  default 'web'
 *
 * Auth: GET is public. POST requires a Bearer token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, getUserSupabase } from '@/lib/api-auth';

type Params = { params: Promise<{ slug: string }> };

const ALLOWED_SOURCES = ['web', 'app', 'ocean_sentinel'] as const;
const ALLOWED_KINDS = [
  'productive', 'rocky', 'snag', 'dead', 'launch', 'parking', 'mixed',
] as const;
const ALLOWED_PRECISION = ['exact', '100m', '500m'] as const;
const MAX_POSTS_PER_HOUR = 10;

function publicSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export async function GET(req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  const kind = searchParams.get('kind');
  const includePending = searchParams.get('include_pending') === 'true';

  const anon = publicSupabase();
  const { data: spot } = await anon
    .from('spots')
    .select('id, slug, name, emirate, center_lat, center_lon, access_type, length_m, default_species, best_time, facilities')
    .eq('slug', slug)
    .eq('verified', true)
    .maybeSingle();

  if (!spot) return NextResponse.json({ error: 'Spot not found' }, { status: 404 });

  let ownWaypoints: unknown[] = [];
  if (includePending) {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;
    const sb = getUserSupabase(auth.token);
    let q = sb.from('spot_waypoints')
      .select('*')
      .eq('spot_id', spot.id)
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false });
    if (kind) q = q.eq('kind', kind);
    const { data } = await q;
    ownWaypoints = data ?? [];
  }

  let q = anon.from('spot_waypoints')
    .select(`
      id, spot_id, user_id, latitude, longitude, kind, label, photo_url,
      target_species, precision, video_url, source,
      confirm_count, stale_count, wrong_count, verified, created_at, updated_at,
      author:profiles!spot_waypoints_user_id_fkey(
        username, display_name, avatar_url,
        is_creator, youtube_channel, instagram_handle, tiktok_handle
      )
    `)
    .eq('spot_id', spot.id)
    .eq('verified', true)
    .eq('is_private', false)
    .order('confirm_count', { ascending: false });
  if (kind) q = q.eq('kind', kind);
  const { data: verified, error } = await q;

  if (error) {
    console.error('[spots/waypoints GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({
    spot,
    waypoints: verified ?? [],
    pending: ownWaypoints,
  });
}

export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { slug } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const lat = Number(body.latitude);
  const lon = Number(body.longitude);
  const kind = String(body.kind ?? '');
  const label = body.label == null ? null : String(body.label).slice(0, 280);
  const photoUrl = body.photo_url == null ? null : String(body.photo_url);
  const precision = String(body.precision ?? 'exact');
  const isPrivate = Boolean(body.is_private);
  const targetSpecies = Array.isArray(body.target_species)
    ? body.target_species.map(String).slice(0, 20)
    : [];
  const videoUrl = body.video_url == null ? null : String(body.video_url);
  const source = String(body.source ?? 'web');

  if (!Number.isFinite(lat) || lat < 22 || lat > 27) {
    return NextResponse.json({ error: 'latitude out of UAE range' }, { status: 400 });
  }
  if (!Number.isFinite(lon) || lon < 51 || lon > 57) {
    return NextResponse.json({ error: 'longitude out of UAE range' }, { status: 400 });
  }
  if (!(ALLOWED_KINDS as readonly string[]).includes(kind)) {
    return NextResponse.json({ error: `kind must be one of ${ALLOWED_KINDS.join(', ')}` }, { status: 400 });
  }
  if (!(ALLOWED_PRECISION as readonly string[]).includes(precision)) {
    return NextResponse.json({ error: `precision must be one of ${ALLOWED_PRECISION.join(', ')}` }, { status: 400 });
  }
  if (photoUrl && !/^https?:\/\//i.test(photoUrl)) {
    return NextResponse.json({ error: 'photo_url must be http(s)' }, { status: 400 });
  }
  if (videoUrl && !/^https?:\/\//i.test(videoUrl)) {
    return NextResponse.json({ error: 'video_url must be http(s)' }, { status: 400 });
  }
  if (!(ALLOWED_SOURCES as readonly string[]).includes(source)) {
    return NextResponse.json({ error: `source must be one of ${ALLOWED_SOURCES.join(', ')}` }, { status: 400 });
  }

  const sb = getUserSupabase(auth.token);

  const { data: spot, error: spotErr } = await sb
    .from('spots')
    .select('id')
    .eq('slug', slug)
    .eq('verified', true)
    .maybeSingle();
  if (spotErr) {
    console.error('[spots/waypoints POST]', spotErr);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  if (!spot) return NextResponse.json({ error: 'Spot not found' }, { status: 404 });

  const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const { count: recentCount } = await sb
    .from('spot_waypoints')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', auth.user.id)
    .gte('created_at', hourAgo);
  if ((recentCount ?? 0) >= MAX_POSTS_PER_HOUR) {
    return NextResponse.json(
      { error: `Rate limit — max ${MAX_POSTS_PER_HOUR} waypoints per hour` },
      { status: 429 },
    );
  }

  const { data: inRange, error: rpcErr } = await sb
    .rpc('waypoint_within_spot', { p_spot_id: spot.id, p_lat: lat, p_lon: lon });
  if (rpcErr) {
    console.error('[spots/waypoints POST]', rpcErr);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  if (!inRange) {
    return NextResponse.json(
      { error: 'Coordinates are outside this spot. Submit a new-spot proposal instead.' },
      { status: 422 },
    );
  }

  const { data: inserted, error: insErr } = await sb
    .from('spot_waypoints')
    .insert({
      spot_id: spot.id,
      user_id: auth.user.id,
      latitude: lat,
      longitude: lon,
      kind,
      label,
      photo_url: photoUrl,
      target_species: targetSpecies,
      precision,
      is_private: isPrivate,
      video_url: videoUrl,
      source,
    })
    .select('*')
    .single();

  if (insErr) {
    console.error('[spots/waypoints POST]', insErr);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ waypoint: inserted }, { status: 201 });
}
