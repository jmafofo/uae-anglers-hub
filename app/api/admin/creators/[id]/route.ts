/**
 * POST /api/admin/creators/[id] — toggle verified-creator status
 *
 * Body (JSON):
 *   is_creator   boolean  required
 *
 * Auth: Bearer token + profiles.is_admin.
 *
 * Uses the service role because `profiles.is_creator` is guarded
 * by the "Users update own profile without elevating" RLS policy
 * — users can't flip it themselves. Social links (youtube_channel,
 * tiktok_handle, instagram_handle, facebook_page, creator_bio)
 * remain self-editable by the creator.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, getUserSupabase } from '@/lib/api-auth';

type Params = { params: Promise<{ id: string }> };

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const sb = getUserSupabase(auth.token);
  const { data: me } = await sb.from('profiles').select('is_admin').eq('id', auth.user.id).single();
  if (!me?.is_admin) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof body.is_creator !== 'boolean') {
    return NextResponse.json({ error: 'is_creator (boolean) required' }, { status: 400 });
  }

  const admin = adminSupabase();
  const { data, error } = await admin
    .from('profiles')
    .update({ is_creator: body.is_creator })
    .eq('id', id)
    .select('id, username, display_name, is_creator')
    .single();
  if (error) {
    console.error('[admin/creators]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  return NextResponse.json({ profile: data });
}
