/**
 * POST /api/rfid/register
 *
 * Associates an RFID tag with a species/catch for the first time.
 * Called by the mobile app when a scanned tag returns found=false from /api/rfid/lookup.
 *
 * Body:
 *   rfid_tag          string   required — the scanned tag ID
 *   species?          string   — common name (can be unnamed_XXXX if unidentified)
 *   scientific_name?  string
 *   first_catch_id?   string   — UUID of the catch record this tag was first seen on
 *   notes?            string
 *
 * Response:
 *   { tag: FishTag }
 *
 * Auth: Bearer token required
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getUserSupabase } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  let body: {
    rfid_tag?: string;
    species?: string;
    scientific_name?: string;
    first_catch_id?: string;
    notes?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const rfid_tag = body.rfid_tag?.trim();
  if (!rfid_tag) {
    return NextResponse.json({ error: 'rfid_tag is required' }, { status: 400 });
  }

  const sb = getUserSupabase(auth.token);

  // ── Upsert — safe to call again if tag already registered ─────
  const { data, error } = await sb
    .from('fish_tags')
    .upsert(
      {
        rfid_tag,
        species:         body.species         ?? null,
        scientific_name: body.scientific_name  ?? null,
        first_catch_id:  body.first_catch_id   ?? null,
        registered_by:   auth.user.id,
        notes:           body.notes            ?? null,
      },
      { onConflict: 'rfid_tag', ignoreDuplicates: false },
    )
    .select()
    .single();

  if (error) {
    console.error('[rfid/register]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tag: data }, { status: 201 });
}
