import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createHash } from 'crypto';

/**
 * POST /api/visit
 * Records a unique site visit. Deduplicates by IP hash (per day).
 * Returns the total unique visitor count.
 */
export async function POST(req: NextRequest) {
  const admin = getSupabaseAdmin();

  // Hash the IP for privacy
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ?? 'unknown';
  const ipHash = createHash('sha256').update(ip).digest('hex').slice(0, 32);

  // Upsert: only count each IP once per day
  const today = new Date().toISOString().split('T')[0];
  const { error: upsertErr } = await admin
    .from('site_visits')
    .upsert(
      { ip_hash: `${ipHash}:${today}`, visited_at: new Date().toISOString() },
      { onConflict: 'ip_hash' }
    );

  if (upsertErr) {
    console.error('[visit]', upsertErr);
  }

  // Get total unique visitor count
  const { count, error: countErr } = await admin
    .from('site_visits')
    .select('*', { count: 'exact', head: true });

  if (countErr) {
    console.error('[visit] count', countErr);
  }

  return NextResponse.json({
    totalVisitors: count ?? 0,
    recorded: !upsertErr,
  });
}

/**
 * GET /api/visit
 * Returns the total unique visitor count (read-only).
 */
export async function GET() {
  const admin = getSupabaseAdmin();

  const { count, error } = await admin
    .from('site_visits')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('[visit] count', error);
    return NextResponse.json({ totalVisitors: 0 });
  }

  return NextResponse.json({ totalVisitors: count ?? 0 });
}
