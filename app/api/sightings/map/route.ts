/**
 * GET /api/sightings/map
 *
 * Public community sightings for map display.
 * No auth required — returns only public, geolocated catches.
 *
 * Query params:
 *   bbox?    "minLat,minLng,maxLat,maxLng"  — filter to viewport bounds
 *   species? string                          — partial species name filter
 *   since?   ISO date string                 — only catches after this date
 *   limit?   number  default 500, max 1000
 *
 * Response:
 *   { sightings: SightingPoint[], count: number }
 *
 * SightingPoint:
 *   { id, species, scientific_name, latitude, longitude, caught_at,
 *     identification_status, unnamed_key }
 *
 * Cache: 60s public, 5 min stale-while-revalidate
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  // Lazy-initialize inside the handler so missing env vars fail at request
  // time (with a useful error) rather than crashing the build
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error('[sightings/map] Missing Supabase env vars');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  // Service-role client — reads across all users for public map data
  const supabase = createClient(supabaseUrl, serviceKey);
  const { searchParams } = new URL(req.url);

  const bbox   = searchParams.get('bbox');   // "minLat,minLng,maxLat,maxLng"
  const species = searchParams.get('species');
  const since  = searchParams.get('since');
  const limit  = Math.min(1000, Math.max(1, Number(searchParams.get('limit') ?? 500)));

  let query = supabase
    .from('catches')
    .select(
      'id, species, scientific_name, latitude, longitude, caught_at, identification_status, unnamed_key',
    )
    .not('latitude',  'is', null)
    .not('longitude', 'is', null)
    .eq('is_public', true)
    .in('identification_status', ['identified', 'unnamed'])
    .order('caught_at', { ascending: false })
    .limit(limit);

  // Bounding box — only load markers visible in the current map viewport
  if (bbox) {
    const parts = bbox.split(',').map(Number);
    if (parts.length === 4 && parts.every(n => !isNaN(n))) {
      const [minLat, minLng, maxLat, maxLng] = parts;
      query = query
        .gte('latitude',  minLat)
        .lte('latitude',  maxLat)
        .gte('longitude', minLng)
        .lte('longitude', maxLng);
    }
  }

  // Species name search
  if (species) {
    query = query.ilike('species', `%${species}%`);
  }

  // Date filter — e.g. "last 30 days" from mobile
  if (since) {
    query = query.gte('caught_at', since);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[sightings/map] DB error:', error);
    return NextResponse.json({ error: 'Failed to fetch sightings' }, { status: 500 });
  }

  return NextResponse.json(
    { sightings: data ?? [], count: data?.length ?? 0 },
    {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    },
  );
}
