/**
 * GET   /api/profile/me   — current user's full profile row
 * PATCH /api/profile/me   — update mutable profile fields
 *
 * Editable fields (anything else is ignored):
 *   display_name  string  ≤80 chars
 *   bio           string  ≤500 chars
 *   avatar_url    string  ≤500 chars  (URL paste; we don't host avatars yet)
 *   emirate       string  ≤40 chars
 *
 * Auth: cookie session (web) or Bearer token (mobile). RLS on
 * profiles still enforces "users can only update their own row",
 * so this route is mostly about input shape and convenience.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUniversal, getUserSupabase } from '@/lib/api-auth';

const LIMITS = {
  display_name: 80,
  bio:          500,
  avatar_url:   500,
  emirate:      40,
} as const;

const EDITABLE_KEYS = ['display_name', 'bio', 'avatar_url', 'emirate'] as const;
const DM_POLICIES = ['open', 'followers_only', 'closed'] as const;

export async function GET(req: NextRequest) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const sb = getUserSupabase(auth.token);
  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .eq('id', auth.user.id)
    .single();

  if (error) {
    console.error('[profile/me GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ profile: data });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Build a sanitised patch — anything not in EDITABLE_KEYS is dropped.
  const patch: Record<string, string | boolean | null> = {};
  for (const key of EDITABLE_KEYS) {
    if (!(key in body)) continue;
    const v = body[key];
    if (v === null || v === '') {
      patch[key] = null;
      continue;
    }
    if (typeof v !== 'string') {
      return NextResponse.json({ error: `${key} must be a string` }, { status: 400 });
    }
    const trimmed = v.trim();
    if (trimmed.length > LIMITS[key]) {
      return NextResponse.json({ error: `${key} exceeds ${LIMITS[key]} chars` }, { status: 400 });
    }
    if (key === 'avatar_url' && trimmed && !/^https?:\/\//i.test(trimmed)) {
      return NextResponse.json({ error: 'avatar_url must be an http(s) URL' }, { status: 400 });
    }
    patch[key] = trimmed;
  }

  // Privacy controls — boolean + enum.
  if ('appear_offline' in body) {
    if (typeof body.appear_offline !== 'boolean') {
      return NextResponse.json({ error: 'appear_offline must be boolean' }, { status: 400 });
    }
    patch.appear_offline = body.appear_offline;
  }
  if ('dm_policy' in body) {
    if (typeof body.dm_policy !== 'string' || !(DM_POLICIES as readonly string[]).includes(body.dm_policy)) {
      return NextResponse.json(
        { error: `dm_policy must be one of ${DM_POLICIES.join(', ')}` },
        { status: 400 },
      );
    }
    patch.dm_policy = body.dm_policy;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No editable fields provided' }, { status: 400 });
  }

  const sb = getUserSupabase(auth.token);
  const { data, error } = await sb
    .from('profiles')
    .update(patch)
    .eq('id', auth.user.id)
    .select()
    .single();

  if (error) {
    console.error('[profile/me PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ profile: data });
}
