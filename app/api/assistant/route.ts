/**
 * POST /api/assistant
 *
 * Chat completion via Claude Haiku 4.5 — UAE-fishing-tuned system prompt
 * with optional live weather context appended. Streams text deltas back
 * to the client as a `text/plain` chunked response.
 *
 * Body (JSON):
 *   messages   { role: 'user' | 'assistant'; content: string }[]   required
 *   weather?   { temp, wind, description, wave, score }            optional
 *
 * Auth: Bearer token required. Anonymous calls are rejected so the
 * Anthropic spend can be attributed to a user and capped per-user.
 *
 * Quotas:
 *   - Free users: FREE_ASSISTANT_PER_DAY/day (DB-backed via
 *     assistant_count_today RPC). Returns 402 when exceeded.
 *   - Ocean Sentinel premium users: unlimited.
 *   - In-memory burst limit (MAX_TURNS_PER_USER per RATE_WINDOW_MS) is
 *     a per-instance fallback that also runs when the RPC is unavailable
 *     (e.g. before the migration is applied).
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { requireAuth, getUserSupabase } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { z } from 'zod';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MAX_MESSAGES           = 20;     // keep last N from client
const MAX_CONTENT_CHARS      = 2000;   // per message
const MAX_TURNS_PER_USER     = 30;     // burst cap per window (in-memory fallback)
const RATE_WINDOW_MS         = 10 * 60 * 1000; // 10 minutes
const FREE_ASSISTANT_PER_DAY = 100;    // free-tier daily turns

const SYSTEM_PROMPT = `You are the UAE Anglers Hub AI Fishing Assistant — an expert fishing guide specialising in UAE waters. You help anglers fish smarter across all 7 Emirates: Abu Dhabi, Dubai, Sharjah, Ajman, Umm Al Quwain, Ras Al Khaimah, and Fujairah.

Your expertise includes:
- Shore fishing, kayak fishing, boat fishing, and deep-sea charter fishing in UAE
- Local fish species: Hammour (Grouper), Kingfish, Barracuda, Queenfish, Trevally, Snapper, Cobia, Sailfish, Yellowfin Tuna, Dorado, Sultan Ibrahim, Sea Bream, and more
- UAE fishing spots, best times, tides, and seasonal patterns
- Bait and lure recommendations for UAE conditions
- UAE fishing regulations, licensing, and protected species
- Gear recommendations suited to UAE saltwater conditions
- Weather interpretation for fishing (wind, tide, moon phase, water temperature)

Tone: Friendly, knowledgeable, concise. Keep responses focused and practical. When asked about conditions, always consider current season (UAE has hot summers Apr-Oct and cooler productive winters Nov-Mar). Suggest specific spots when relevant.`;

// Instance-local burst limit. Catches spammy clients within a single
// instance even if the DB quota is bypassed (e.g. RPC unavailable
// during deploys). Resets on cold start.
const rateLog = new Map<string, number[]>();

function checkBurst(userId: string): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const windowStart = now - RATE_WINDOW_MS;
  const hits = (rateLog.get(userId) ?? []).filter((t) => t > windowStart);
  if (hits.length >= MAX_TURNS_PER_USER) {
    const retryAfterSec = Math.ceil((hits[0] + RATE_WINDOW_MS - now) / 1000);
    return { ok: false, retryAfterSec };
  }
  hits.push(now);
  rateLog.set(userId, hits);
  return { ok: true };
}

const bodySchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().min(1).max(2000),
    }),
  ).min(1).max(20),
  weather: z.object({
    temp: z.number(),
    wind: z.number(),
    description: z.string(),
    wave: z.number(),
    score: z.number(),
  }).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;

    const burst = checkBurst(auth.user.id);
    if (!burst.ok) {
      return NextResponse.json(
        { error: 'Rate limit reached — try again shortly', retryAfterSec: burst.retryAfterSec },
        { status: 429, headers: { 'Retry-After': String(burst.retryAfterSec) } },
      );
    }

    // ── Daily quota (DB-backed, premium bypass) ─────────────────
    // Mirrors /api/identify. We only block free users — premium
    // bypasses entirely. Errors querying the RPC fall through:
    // the in-memory burst limit above is the floor.
    const sb = getUserSupabase(auth.token);
    const { data: profile } = await sb
      .from('profiles')
      .select('ocean_sentinel_premium')
      .eq('id', auth.user.id)
      .maybeSingle();
    const isPremium = Boolean(profile?.ocean_sentinel_premium);

    let usedToday: number | null = null;
    if (!isPremium) {
      const { data: countRaw, error: countErr } = await sb.rpc('assistant_count_today', { p_user_id: auth.user.id });
      if (countErr) {
        // Migration not applied yet, or transient DB error. Log and
        // fall through — burst limiter still protects us.
        console.warn('[assistant POST] assistant_count_today unavailable:', countErr.message);
      } else {
        usedToday = Number(countRaw ?? 0);
        if (usedToday >= FREE_ASSISTANT_PER_DAY) {
          return NextResponse.json(
            {
              error: 'Daily assistant limit reached',
              limit: FREE_ASSISTANT_PER_DAY,
              used: usedToday,
              upgrade: 'Subscribe to Ocean Sentinel for unlimited assistant chats.',
            },
            { status: 402 },
          );
        }
      }
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

    const { messages, weather } = parsed.data;

    const weatherSuffix = weather
      ? `\n\nCurrent conditions provided by user: Temperature ${weather.temp}°C, Wind ${weather.wind} km/h, Weather: ${weather.description}, Wave height: ${weather.wave}m, Fishing score: ${weather.score}/100.`
      : '';

    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    const promptChars = lastUserMsg?.content.length ?? 0;

    // Stream text deltas as a plain `text/plain` chunked response. The
    // client reads the body with a ReadableStream and appends incrementally —
    // simpler than SSE and avoids shipping the Anthropic SDK to the browser.
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let responseChars = 0;
        let succeeded = false;
        try {
          const anthropicStream = client.messages.stream({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            system: [
              { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
              ...(weatherSuffix ? [{ type: 'text' as const, text: weatherSuffix }] : []),
            ],
            messages: messages.slice(-MAX_MESSAGES),
          });

          for await (const event of anthropicStream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              const delta = event.delta.text;
              responseChars += delta.length;
              controller.enqueue(encoder.encode(delta));
            }
          }
          succeeded = true;
          controller.close();
        } catch (err) {
          console.error('[assistant POST]', err);
          // Surface a terminal sentinel the client can detect.
          try {
            controller.enqueue(encoder.encode('\n\n[error: AI unavailable]'));
          } catch { /* controller may already be closed */ }
          controller.close();
        }

        // Record the turn after the stream finishes. Only logged on
        // success — we don't want failed Anthropic calls counting
        // against the user's quota. Errors are non-fatal (route already
        // returned the response by this point). Service-role client
        // because assistant_usage RLS denies user-token writes.
        if (succeeded) {
          try {
            const admin = getSupabaseAdmin();
            const { error: insertErr } = await admin.from('assistant_usage').insert({
              user_id: auth.user.id,
              prompt_chars: promptChars,
              response_chars: responseChars,
            });
            if (insertErr) {
              console.warn('[assistant POST] usage insert failed:', insertErr.message);
            }
          } catch (err) {
            console.warn('[assistant POST] usage insert threw:', err);
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('[assistant POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
