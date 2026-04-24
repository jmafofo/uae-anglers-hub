/**
 * GET /api/news — list news items for the landing page / feed
 *
 * Query params:
 *   category? fishing | marine_life | regulation | tournament | conservation
 *   featured? 'true'  — only featured items
 *   limit?    number 1–50   default 12
 *
 * Auth: public.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const featured = searchParams.get('featured') === 'true';
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 12)));

  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  let q = anon
    .from('news_items')
    .select('id, slug, category, headline, excerpt, hero_image_url, source_url, source_name, is_featured, published_at')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (category) q = q.eq('category', category);
  if (featured) q = q.eq('is_featured', true);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}
