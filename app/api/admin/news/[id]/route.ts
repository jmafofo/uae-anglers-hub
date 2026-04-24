/**
 * DELETE /api/admin/news/[id]       — remove a news item (admin only)
 * PATCH  /api/admin/news/[id]       — update fields (admin only)
 *
 * PATCH body: any subset of the POST body fields.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getUserSupabase } from '@/lib/api-auth';

type Params = { params: Promise<{ id: string }> };

const ALLOWED_CATEGORIES = [
  'fishing', 'marine_life', 'regulation', 'tournament', 'conservation',
] as const;

type AdminCheck =
  | { ok: true; sb: ReturnType<typeof getUserSupabase> }
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
  return { ok: true, sb };
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const check = await requireAdmin(req);
  if (!check.ok) return check.response;

  const { id } = await params;
  const { error } = await check.sb.from('news_items').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const check = await requireAdmin(req);
  if (!check.ok) return check.response;

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (body.category != null) {
    const c = String(body.category);
    if (!(ALLOWED_CATEGORIES as readonly string[]).includes(c)) {
      return NextResponse.json({ error: 'invalid category' }, { status: 400 });
    }
    updates.category = c;
  }
  if (body.headline != null) updates.headline = String(body.headline).slice(0, 160);
  if (body.excerpt != null) updates.excerpt = String(body.excerpt).slice(0, 400);
  if (body.body != null) updates.body = String(body.body).slice(0, 20000);
  if (body.hero_image_url !== undefined) updates.hero_image_url = body.hero_image_url;
  if (body.source_url !== undefined) updates.source_url = body.source_url;
  if (body.source_name !== undefined) updates.source_name = body.source_name;
  if (body.is_featured != null) updates.is_featured = Boolean(body.is_featured);
  if (body.published_at != null) {
    updates.published_at = new Date(String(body.published_at)).toISOString();
  }

  const { data, error } = await check.sb
    .from('news_items')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}
