/**
 * GET /api/ads/next?placement=X&species=Y&emirate=Z
 *
 * Returns the next sponsored placement for the given context, or
 * { ad: null } when there's no eligible campaign or the requester
 * is an Ocean Sentinel premium subscriber.
 *
 * The response includes an `impression_id` — the impression has
 * already been recorded server-side, so the mobile client doesn't
 * need to fire a separate beacon. Click-throughs go to
 * /api/ads/click?cid=<id>&iid=<impression_id> which 302s to the
 * sponsor's target URL after recording.
 *
 * Auth: optional. Bearer token enables premium gating + per-user
 * impression attribution. Anonymous callers still get served.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { pickAndRecordAd, type Placement, PLACEMENTS } from '@/lib/ads';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const placement = searchParams.get('placement') ?? '';
  const species   = searchParams.get('species');
  const emirate   = searchParams.get('emirate');

  if (!(PLACEMENTS as readonly string[]).includes(placement)) {
    return NextResponse.json(
      { error: `placement must be one of ${PLACEMENTS.join(', ')}` },
      { status: 400 },
    );
  }

  let user: { id: string; isPremium: boolean } | null = null;
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    );
    const { data: { user: u } } = await sb.auth.getUser();
    if (u) {
      const { data: profile } = await sb
        .from('profiles')
        .select('ocean_sentinel_premium')
        .eq('id', u.id)
        .single();
      user = { id: u.id, isPremium: Boolean(profile?.ocean_sentinel_premium) };
    }
  }

  const ad = await pickAndRecordAd(placement as Placement, { species, emirate }, user);

  return NextResponse.json({ ad });
}
