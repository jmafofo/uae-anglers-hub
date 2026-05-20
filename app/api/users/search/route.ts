/**
 * GET /api/users/search?q=<query>&limit=<n>
 *
 * Search profiles by username, display_name, or email (case-insensitive).
 * Returns public profile info only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') ?? '').trim();
  const limit = Math.min(20, Math.max(1, Number(searchParams.get('limit') ?? 10)));

  if (!q || q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  // Public client for profiles search
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data: profiles, error: profErr } = await sb
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .or(`username.ilike.${q}%,display_name.ilike.${q}%`)
    .limit(limit);

  if (profErr) {
    console.error('[users search] profiles', profErr);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }

  const results = new Map<string, { id: string; username: string; display_name: string | null; avatar_url: string | null }>();
  for (const p of profiles ?? []) {
    results.set(p.id, p);
  }

  // Also search auth.users by email using service-role client
  try {
    const admin = getSupabaseAdmin();
    const { data: authData, error: authErr } = await admin.auth.admin.listUsers();
    if (!authErr && authData?.users) {
      const matched = authData.users
        .filter((u) => u.email?.toLowerCase().startsWith(q.toLowerCase()))
        .slice(0, limit);
      if (matched.length > 0) {
        const userIds = matched.map((u) => u.id);
        const { data: emailProfiles } = await sb
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', userIds);
        for (const p of emailProfiles ?? []) {
          if (!results.has(p.id)) {
            results.set(p.id, p);
          }
        }
      }
    }
  } catch (e) {
    // Email search is best-effort; don't fail the whole request
    console.warn('[users search] email lookup skipped', e);
  }

  return NextResponse.json({ users: Array.from(results.values()).slice(0, limit) });
}
