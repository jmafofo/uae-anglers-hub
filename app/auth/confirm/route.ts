/**
 * GET /auth/confirm
 *
 * Handles Supabase email confirmation links.
 * Supabase redirects here after a user clicks "Confirm your email".
 *
 * Supports both flows:
 *   - token_hash  (OTP flow) — ?token_hash=xxx&type=email
 *   - code        (PKCE flow) — ?code=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { EmailOtpType } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token_hash = searchParams.get('token_hash');
  const code       = searchParams.get('code');
  const type       = (searchParams.get('type') ?? 'email') as EmailOtpType;
  const next       = searchParams.get('next') ?? '/';

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  try {
    if (token_hash) {
      // OTP / magic-link flow
      const { error } = await supabase.auth.verifyOtp({ token_hash, type });
      if (error) throw error;
    } else if (code) {
      // PKCE flow (OAuth / newer Supabase default)
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
    } else {
      throw new Error('No token or code provided in confirmation link.');
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Confirmation failed.';
    // Redirect to login with error message
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(msg)}`, req.url),
    );
  }

  // Success — redirect to the intended destination (default: home)
  const redirectTo = next.startsWith('/') ? next : '/';
  return NextResponse.redirect(new URL(redirectTo, req.url));
}
