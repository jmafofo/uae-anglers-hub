/**
 * POST   /api/waypoints/[id]/vote  — cast or change vote on a waypoint
 * DELETE /api/waypoints/[id]/vote  — retract own vote
 *
 * POST body: { vote: 'confirmed' | 'stale' | 'wrong' }
 * Auth: Bearer token required.
 *
 * The `waypoint_votes` table's PK is (waypoint_id, user_id),
 * so POST performs an upsert. The recount trigger updates
 * `spot_waypoints.verified` automatically (≥3 confirms, no
 * majority 'wrong', self-votes excluded).
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getUserSupabase } from '@/lib/api-auth';

type Params = { params: Promise<{ id: string }> };

const ALLOWED_VOTES = ['confirmed', 'stale', 'wrong'] as const;

export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const vote = String(body.vote ?? '');
  if (!(ALLOWED_VOTES as readonly string[]).includes(vote)) {
    return NextResponse.json(
      { error: `vote must be one of ${ALLOWED_VOTES.join(', ')}` },
      { status: 400 },
    );
  }

  const sb = getUserSupabase(auth.token);

  const { data: waypoint } = await sb
    .from('spot_waypoints')
    .select('id')
    .eq('id', id)
    .maybeSingle();
  if (!waypoint) return NextResponse.json({ error: 'Waypoint not found' }, { status: 404 });

  const { error } = await sb
    .from('waypoint_votes')
    .upsert(
      { waypoint_id: id, user_id: auth.user.id, vote },
      { onConflict: 'waypoint_id,user_id' },
    );

  if (error) {
    console.error('[waypoints/vote POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }


  const { data: tally } = await sb
    .from('spot_waypoints')
    .select('confirm_count, stale_count, wrong_count, verified')
    .eq('id', id)
    .single();

  return NextResponse.json({ ok: true, tally });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const sb = getUserSupabase(auth.token);

  const { error } = await sb
    .from('waypoint_votes')
    .delete()
    .eq('waypoint_id', id)
    .eq('user_id', auth.user.id);

  if (error) {
    console.error('[waypoints/vote DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
