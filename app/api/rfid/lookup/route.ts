/**
 * POST /api/rfid/lookup
 *
 * Looks up a fish by its RFID tag ID. The mobile app calls this immediately
 * after scanning a tag — it returns the registered species info and the
 * catch history for that tag.
 *
 * Body:
 *   rfid_tag  string  required — the scanned tag ID (hex or decimal)
 *
 * Response (tag known):
 *   {
 *     found: true,
 *     tag: { rfid_tag, species, scientific_name, registered_at, notes },
 *     catch_count: number,
 *     last_catch: catch | null
 *   }
 *
 * Response (tag unknown):
 *   { found: false, rfid_tag: string }
 *
 * Auth: Bearer token required
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getUserSupabase } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  let body: { rfid_tag?: string };
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

  // ── Look up the tag registration ──────────────────────────────
  const { data: tag, error: tagErr } = await sb
    .from('fish_tags')
    .select('*')
    .eq('rfid_tag', rfid_tag)
    .maybeSingle();

  if (tagErr) {
    console.error('[rfid/lookup]', tagErr);
    return NextResponse.json({ error: tagErr.message }, { status: 500 });
  }

  if (!tag) {
    // Unknown tag — the app should prompt the user to register it
    return NextResponse.json({ found: false, rfid_tag });
  }

  // ── Fetch catch history for this tag ──────────────────────────
  const { data: catches, error: catchErr } = await sb
    .from('catches')
    .select('id, species, scientific_name, caught_at, latitude, longitude, emirate, weight_kg, length_cm, photo_url')
    .eq('rfid_tag', rfid_tag)
    .order('caught_at', { ascending: false })
    .limit(10);

  if (catchErr) {
    console.error('[rfid/lookup catches]', catchErr);
  }

  return NextResponse.json({
    found: true,
    tag,
    catch_count: catches?.length ?? 0,
    last_catch: catches?.[0] ?? null,
    catch_history: catches ?? [],
  });
}
