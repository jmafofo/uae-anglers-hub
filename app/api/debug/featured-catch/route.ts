import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = getSupabaseAdmin();

  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);

  let { data: winner, error: monthErr } = await admin
    .from('catches')
    .select('id, species, weight_kg, length_cm, bait, technique, photo_url, photo_urls, caught_at, created_at, user_id, profiles(display_name, username)')
    .eq('is_public', true)
    .not('weight_kg', 'is', null)
    .gte('caught_at', monthAgo.toISOString())
    .order('weight_kg', { ascending: false })
    .limit(1)
    .maybeSingle();

  let source = 'month';
  if (!winner) {
    const { data: allTime, error: allErr } = await admin
      .from('catches')
      .select('id, species, weight_kg, length_cm, bait, technique, photo_url, photo_urls, caught_at, created_at, user_id, profiles(display_name, username)')
      .eq('is_public', true)
      .not('weight_kg', 'is', null)
      .order('weight_kg', { ascending: false })
      .limit(1)
      .maybeSingle();
    winner = allTime;
    source = 'allTime';
    if (allErr) return NextResponse.json({ error: allErr.message }, { status: 500 });
  } else if (monthErr) {
    return NextResponse.json({ error: monthErr.message }, { status: 500 });
  }

  if (!winner) {
    return NextResponse.json({ error: 'No public catches found' }, { status: 404 });
  }

  const imageUrl = (winner.photo_urls?.[0] ?? winner.photo_url) as string | null;

  // Test if the image URL is reachable
  let imageTest = null;
  if (imageUrl) {
    try {
      const res = await fetch(imageUrl, { method: 'HEAD' });
      imageTest = {
        status: res.status,
        statusText: res.statusText,
        contentType: res.headers.get('content-type'),
        contentLength: res.headers.get('content-length'),
      };
    } catch (e) {
      imageTest = {
        error: e instanceof Error ? e.message : 'Fetch failed',
      };
    }
  }

  return NextResponse.json({
    source,
    catch: winner,
    imageUrl,
    imageTest,
    bucketCheckUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/bucket/catches`,
  });
}
