/**
 * POST /api/signup-errors
 *
 * Records a signup failure seen in the browser so we can watch
 * for patterns after launch. Posted from the signup form when
 * supabase.auth.signUp returns an error.
 *
 * No auth — the user by definition doesn't have a session yet.
 * Rate-limited in two ways:
 *   1. In-memory per-IP counter (60/hour/ip) — cheap first line.
 *   2. A trivial SQL-side deduplication: if the same error_message
 *      from the same ip_hash was logged in the last 60 seconds,
 *      we skip the insert to stop retry loops from filling the
 *      table.
 *
 * Writes go via the service role because signup_errors has no
 * INSERT policy (admin-read only, closed to everyone else).
 *
 * Body (JSON):
 *   error_message  string   required, ≤ 500 chars
 *   email          string   optional — we store only the domain
 *   path           string   optional — e.g. '/signup'
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import { z } from 'zod';

const hits = new Map<string, { count: number; resetAt: number }>();
const LIMIT_PER_HOUR = 60;
const DEDUPE_WINDOW_MS = 60_000;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const row = hits.get(ip);
  if (!row || row.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + 3_600_000 });
    return false;
  }
  row.count += 1;
  return row.count > LIMIT_PER_HOUR;
}

function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip + (process.env.SIGNUP_LOG_SALT ?? 'uae')).digest('hex').slice(0, 16);
}

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

const bodySchema = z.object({
  error_message: z.string().max(500),
  email_domain: z.string().optional(),
  email: z.string().optional(),
  path: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    if (rateLimited(ip)) {
      return NextResponse.json({ ok: true, rateLimited: true }, { status: 202 });
    }

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const body = parsed.data;
    const errorMessage = body.error_message;
    const emailDomain =
      body.email_domain?.slice(0, 80).toLowerCase() ||
      (body.email?.includes('@')
        ? body.email.split('@').pop()!.toLowerCase().slice(0, 80)
        : null);
    const path = body.path?.slice(0, 120) ?? null;
    const userAgent = req.headers.get('user-agent')?.slice(0, 240) ?? null;
    const ipHash = hashIp(ip);

    const sb = adminSupabase();

    // SQL-side dedupe — skip inserts for the same message + ip in the last minute.
    const since = new Date(Date.now() - DEDUPE_WINDOW_MS).toISOString();
    const { count } = await sb
      .from('signup_errors')
      .select('id', { count: 'exact', head: true })
      .eq('error_message', errorMessage)
      .eq('ip_hash', ipHash)
      .gte('created_at', since);

    if ((count ?? 0) > 0) {
      return NextResponse.json({ ok: true, deduped: true });
    }

    const { error } = await sb.from('signup_errors').insert({
      error_message: errorMessage,
      email_domain:  emailDomain,
      user_agent:    userAgent,
      path,
      ip_hash:       ipHash,
    });

    if (error) {
      console.error('[signup-errors]', error);
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[signup-errors]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
