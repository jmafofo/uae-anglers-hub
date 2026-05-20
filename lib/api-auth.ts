/**
 * API route authentication helpers.
 * Verifies Supabase Bearer tokens sent by the mobile app, or cookie-based auth from the web app.
 */
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';

export type AuthResult =
  | { ok: true; user: User; token: string }
  | { ok: false; response: NextResponse };

/**
 * Extract and verify the Bearer token from an API request.
 * Returns the authenticated user or a ready-made 401 response.
 *
 * Usage:
 *   const auth = await requireAuth(req);
 *   if (!auth.ok) return auth.response;
 *   const { user } = auth;
 */
export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized — Bearer token required' }, { status: 401 }),
    };
  }

  const token = authHeader.slice(7);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized — invalid or expired token' }, { status: 401 }),
    };
  }

  return { ok: true, user, token };
}

/**
 * Try cookie-based auth (web app) first, then fall back to Bearer token (mobile app).
 */
export async function requireAuthUniversal(req: NextRequest): Promise<AuthResult> {
  // Try cookie-based auth first
  const cookieAuth = await getUserFromCookies(req);
  if (cookieAuth) {
    return { ok: true, user: cookieAuth.user, token: cookieAuth.token };
  }

  // Fall back to Bearer token
  return requireAuth(req);
}

async function getUserFromCookies(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll() {},
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  // Extract the access token from cookies if available
  const accessTokenCookie = req.cookies.get('sb-access-token') || req.cookies.get('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').split('.')[0] + '-auth-token');
  const token = accessTokenCookie?.value ?? '';

  return { user, token };
}

/**
 * Build an authenticated Supabase client scoped to a specific user token.
 * Respects RLS — the user can only see/modify their own rows.
 */
export function getUserSupabase(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );
}
