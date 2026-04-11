/**
 * GET    /api/catches/[id]  — fetch a single catch by ID
 * PUT    /api/catches/[id]  — update a catch (e.g. curate an unnamed entry)
 * DELETE /api/catches/[id]  — delete a catch
 *
 * PUT body (all fields optional):
 *   species, scientific_name, weight_kg, length_cm, bait, technique,
 *   location_name, latitude, longitude, emirate, notes, is_public,
 *   caught_at, rfid_tag, identification_status, unnamed_key,
 *   water_colour, pollution_type, pollution_severity, water_temp_c, visibility_m
 *
 * Auth: Bearer token required. Users can only access their own catches.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getUserSupabase } from '@/lib/api-auth';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const sb = getUserSupabase(auth.token);

  const { data, error } = await sb
    .from('catches')
    .select('*')
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Catch not found' }, { status: 404 });
  }

  return NextResponse.json({ catch: data });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Build update payload — only include provided fields
  const update: Record<string, unknown> = {};
  const allowed = [
    'species', 'scientific_name', 'weight_kg', 'length_cm', 'bait', 'technique',
    'location_name', 'latitude', 'longitude', 'emirate', 'photo_url', 'notes',
    'is_public', 'caught_at', 'rfid_tag', 'identification_status', 'unnamed_key',
    'water_colour', 'pollution_type', 'pollution_severity', 'water_temp_c', 'visibility_m',
  ];
  for (const key of allowed) {
    if (key in body) update[key] = body[key] ?? null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
  }

  // Validate GPS if provided
  if ('latitude' in update && update.latitude != null) {
    const lat = Number(update.latitude);
    if (lat < -90 || lat > 90) {
      return NextResponse.json({ error: `Invalid latitude: ${lat}` }, { status: 400 });
    }
  }
  if ('longitude' in update && update.longitude != null) {
    const lon = Number(update.longitude);
    if (lon < -180 || lon > 180) {
      return NextResponse.json({ error: `Invalid longitude: ${lon}` }, { status: 400 });
    }
  }

  const sb = getUserSupabase(auth.token);

  const { data, error } = await sb
    .from('catches')
    .update(update)
    .eq('id', id)
    .eq('user_id', auth.user.id)
    .select()
    .single();

  if (error) {
    console.error('[catches PUT]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Catch not found or not owned by you' }, { status: 404 });
  }

  return NextResponse.json({ catch: data });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const sb = getUserSupabase(auth.token);

  const { error, count } = await sb
    .from('catches')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('user_id', auth.user.id);

  if (error) {
    console.error('[catches DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!count) {
    return NextResponse.json({ error: 'Catch not found or not owned by you' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
