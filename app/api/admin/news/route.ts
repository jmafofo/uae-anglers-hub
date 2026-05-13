/**
 * POST /api/admin/news — create a news item (admin only)
 * GET  /api/admin/news — list all items (including not-yet-featured)
 *
 * POST body (JSON):
 *   category       string  required (fishing|marine_life|regulation|tournament|conservation)
 *   headline       string  required, ≤ 160 chars
 *   excerpt?       string  ≤ 400 chars
 *   body?          string  ≤ 20000 chars
 *   hero_image_url? string http(s)
 *   source_url?    string  http(s)
 *   source_name?   string  ≤ 80 chars
 *   is_featured?   boolean default false
 *   published_at?  ISO string (defaults to now)
 *   slug?          string  (optional override, else slugified from headline)
 *
 * Auth: Bearer token + profiles.is_admin.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getUserSupabase } from '@/lib/api-auth';

const ALLOWED_CATEGORIES = [
  'fishing', 'marine_life', 'regulation', 'tournament', 'conservation',
] as const;

function slugify(s: string) {
  return s.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

type AdminCheck =
  | { ok: true; auth: Awaited<ReturnType<typeof requireAuth>> & { ok: true }; sb: ReturnType<typeof getUserSupabase> }
  | { ok: false; response: NextResponse };

async function requireAdmin(req: NextRequest): Promise<AdminCheck> {
  const auth = await requireAuth(req);
  if (!auth.ok) return { ok: false, response: auth.response };
  const sb = getUserSupabase(auth.token);
  const { data: me } = await sb
    .from('profiles')
    .select('is_admin')
    .eq('id', auth.user.id)
    .single();
  if (!me?.is_admin) {
    return { ok: false, response: NextResponse.json({ error: 'Admin only' }, { status: 403 }) };
  }
  return { ok: true, auth, sb };
}

export async function GET(req: NextRequest) {
  const check = await requireAdmin(req);
  if (!check.ok) return check.response;

  const { data, error } = await check.sb
    .from('news_items')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(200);
  if (error) {
    console.error('[admin/news]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: NextRequest) {
  const check = await requireAdmin(req);
  if (!check.ok) return check.response;
  const { auth, sb } = check;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const category = String(body.category ?? '');
  const headline = String(body.headline ?? '').trim().slice(0, 160);
  const excerpt = body.excerpt == null ? null : String(body.excerpt).slice(0, 400);
  const articleBody = body.body == null ? null : String(body.body).slice(0, 20000);
  const heroImageUrl = body.hero_image_url == null ? null : String(body.hero_image_url);
  const sourceUrl = body.source_url == null ? null : String(body.source_url);
  const sourceName = body.source_name == null ? null : String(body.source_name).slice(0, 80);
  const isFeatured = Boolean(body.is_featured);
  const publishedAt = body.published_at == null
    ? new Date().toISOString()
    : new Date(String(body.published_at)).toISOString();
  const slugInput = body.slug == null ? null : String(body.slug).trim() || null;

  if (!(ALLOWED_CATEGORIES as readonly string[]).includes(category)) {
    return NextResponse.json(
      { error: `category must be one of ${ALLOWED_CATEGORIES.join(', ')}` },
      { status: 400 },
    );
  }
  if (!headline) return NextResponse.json({ error: 'headline is required' }, { status: 400 });
  for (const [field, v] of [['hero_image_url', heroImageUrl], ['source_url', sourceUrl]] as const) {
    if (v && !/^https?:\/\//i.test(v)) {
      return NextResponse.json({ error: `${field} must be http(s)` }, { status: 400 });
    }
  }

  const baseSlug = slugInput ?? slugify(headline);
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  const { data, error } = await sb
    .from('news_items')
    .insert({
      slug,
      category,
      headline,
      excerpt,
      body: articleBody,
      hero_image_url: heroImageUrl,
      source_url: sourceUrl,
      source_name: sourceName,
      is_featured: isFeatured,
      published_at: publishedAt,
      created_by: auth.user.id,
    })
    .select('*')
    .single();
  if (error) {
    console.error('[admin/news]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  return NextResponse.json({ item: data }, { status: 201 });
}
