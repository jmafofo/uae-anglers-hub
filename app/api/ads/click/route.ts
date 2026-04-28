/**
 * GET /api/ads/click?cid=<campaign_id>&iid=<impression_id>
 *
 * Records the click and 302s to the campaign's target_url. First-
 * party redirect — harder for ad blockers to short-circuit and
 * keeps attribution honest.
 *
 * Auth: optional. Bearer token attributes the click to a user
 * for analytics; anonymous clicks are still recorded.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { recordClick } from '@/lib/ads';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const campaignId   = searchParams.get('cid') ?? '';
  const impressionId = searchParams.get('iid');

  if (!campaignId) {
    return NextResponse.json({ error: 'cid required' }, { status: 400 });
  }

  // Look up the target URL via service role — campaign rows are
  // public-readable so an anon client would also work, but going
  // through the admin client avoids extra round trips and keeps
  // the URL authoritative even if the campaign was just toggled
  // inactive (still allow the redirect to land).
  const { data: campaign } = await adminClient()
    .from('ad_campaigns')
    .select('target_url')
    .eq('id', campaignId)
    .maybeSingle();

  if (!campaign?.target_url) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  // Resolve user (best-effort)
  let userId: string | null = null;
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    );
    const { data: { user } } = await sb.auth.getUser();
    if (user) userId = user.id;
  }

  // Fire-and-forget — don't block the redirect on the audit insert.
  void recordClick(campaignId, impressionId, userId).catch(err => {
    console.error('[ads/click] failed to record click', err);
  });

  return NextResponse.redirect(campaign.target_url, 302);
}
