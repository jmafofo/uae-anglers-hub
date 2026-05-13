/**
 * GET /api/hall-of-fame — leaderboard of the biggest catches
 *
 * Query params:
 *   period?   'week' | 'month' | 'year' | 'all'   default 'week'
 *   metric?   'weight' | 'length'                  default 'weight'
 *   species?  string (ILIKE; pass '%kingfish%' for fuzzy)
 *   emirate?  string (matches angler or catch emirate)
 *   limit?    number 1–50                          default 10
 *
 * Eligibility rules (enforced by the hall_of_fame_entries view):
 *   - catch must be public
 *   - weight_kg must be > 0
 *   - identification_status must be 'identified' (or null, for
 *     backward compatibility with older catches)
 *
 * Auth: public — anyone can read the leaderboard.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period  = searchParams.get('period')  ?? 'week';
  const metric  = searchParams.get('metric')  ?? 'weight';
  const species = searchParams.get('species');
  const emirate = searchParams.get('emirate');
  const limit   = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 10)));

  if (!['week', 'month', 'year', 'all'].includes(period)) {
    return NextResponse.json({ error: 'invalid period' }, { status: 400 });
  }
  if (!['weight', 'length'].includes(metric)) {
    return NextResponse.json({ error: 'invalid metric' }, { status: 400 });
  }

  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data, error } = await anon.rpc('hall_of_fame', {
    p_period:  period,
    p_metric:  metric,
    p_species: species,
    p_emirate: emirate,
    p_limit:   limit,
  });

  if (error) {
    console.error('[hall-of-fame]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({
    period, metric,
    species: species ?? null,
    emirate: emirate ?? null,
    entries: data ?? [],
  });
}
