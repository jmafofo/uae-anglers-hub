import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const LIMIT = 20;

/**
 * GET /api/charters
 * Browse the charter directory with optional filters.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const country = searchParams.get('country');
  const emirate = searchParams.get('emirate');
  const coast = searchParams.get('coast');
  const cursor = searchParams.get('cursor');
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || LIMIT));

  const admin = getSupabaseAdmin();

  let query = admin
    .from('charters')
    .select('*')
    .order('is_verified', { ascending: false })
    .order('rating', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (country) query = query.eq('country', country);
  if (emirate) query = query.eq('emirate', emirate);
  if (coast) query = query.eq('coast', coast);
  if (cursor) {
    // Simple cursor: offset-based for now since charters are small
    query = query.gt('created_at', cursor);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[charters] list', error);
    return NextResponse.json({ error: 'Failed to load charters' }, { status: 500 });
  }

  const charters = (data ?? []).map((c: any) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    location: c.location,
    country: c.country,
    emirate: c.emirate,
    coast: c.coast,
    charter_type: c.charter_type,
    target_species: c.target_species,
    duration: c.duration,
    capacity: c.capacity,
    price_aed: c.price_aed,
    highlights: c.highlights,
    contact_email: c.contact_email,
    website: c.website,
    phone: c.phone,
    rating: c.rating,
    photo_urls: c.photo_urls,
    is_verified: c.is_verified,
  }));

  const nextCursor = (data ?? []).length === limit
    ? (data ?? [])[(data ?? []).length - 1].created_at
    : null;

  return NextResponse.json({ charters, nextCursor });
}
