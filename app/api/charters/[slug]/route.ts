import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/charters/:slug
 * Get a single charter by slug.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from('charters')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('[charters] detail', error);
    return NextResponse.json({ error: 'Failed to load charter' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Charter not found' }, { status: 404 });
  }

  return NextResponse.json({ charter: data });
}
