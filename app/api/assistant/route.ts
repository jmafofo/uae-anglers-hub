/**
 * POST /api/assistant
 *
 * Chat completion via Claude Haiku 4.5 — UAE-fishing-tuned system prompt
 * with optional live weather context appended.
 *
 * Body (JSON):
 *   messages   { role: 'user' | 'assistant'; content: string }[]   required
 *   weather?   { temp, wind, description, wave, score }            optional
 *
 * Auth: Bearer token required. Anonymous calls are rejected so the
 * Anthropic spend can be attributed to a user and capped per-user.
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { requireAuth } from '@/lib/api-auth';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MAX_MESSAGES        = 20;     // keep last N from client
const MAX_CONTENT_CHARS   = 2000;   // per message
const MAX_TURNS_PER_USER  = 30;     // soft cap per window
const RATE_WINDOW_MS      = 10 * 60 * 1000; // 10 minutes

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

// Instance-local rate limit. Resets on cold start; tightening to a
// DB-backed quota (à la identify_count_today) is a follow-up.
const rateLog = new Map<string, number[]>();

function checkRate(userId: string): { ok: true } | { ok: false; retryAfterSec: number } {
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

type AssistantMessage = { role: 'user' | 'assistant'; content: string };
type WeatherCtx = { temp: number; wind: number; description: string; wave: number; score: number };

function validateMessages(raw: unknown): AssistantMessage[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: AssistantMessage[] = [];
  for (const m of raw) {
    if (!m || typeof m !== 'object') return null;
    const { role, content } = m as Record<string, unknown>;
    if (role !== 'user' && role !== 'assistant') return null;
    if (typeof content !== 'string' || content.length === 0) return null;
    if (content.length > MAX_CONTENT_CHARS) return null;
    out.push({ role, content });
  }
  return out;
}

function validateWeather(raw: unknown): WeatherCtx | null {
  if (!raw || typeof raw !== 'object') return null;
  const w = raw as Record<string, unknown>;
  if (
    typeof w.temp        !== 'number' ||
    typeof w.wind        !== 'number' ||
    typeof w.wave        !== 'number' ||
    typeof w.score       !== 'number' ||
    typeof w.description !== 'string'
  ) return null;
  return {
    temp: w.temp,
    wind: w.wind,
    wave: w.wave,
    score: w.score,
    description: w.description.slice(0, 80),
  };
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const rate = checkRate(auth.user.id);
  if (!rate.ok) {
    return NextResponse.json(
      { error: 'Rate limit reached — try again shortly', retryAfterSec: rate.retryAfterSec },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } },
    );
  }

  let body: { messages?: unknown; weather?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const messages = validateMessages(body.messages);
  if (!messages) {
    return NextResponse.json({ error: 'messages must be a non-empty array of {role, content}' }, { status: 400 });
  }
  const weather = body.weather === undefined ? null : validateWeather(body.weather);
  if (body.weather !== undefined && weather === null) {
    return NextResponse.json({ error: 'weather payload malformed' }, { status: 400 });
  }

  const weatherSuffix = weather
    ? `\n\nCurrent conditions provided by user: Temperature ${weather.temp}°C, Wind ${weather.wind} km/h, Weather: ${weather.description}, Wave height: ${weather.wave}m, Fishing score: ${weather.score}/100.`
    : '';

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      // Cache the static UAE expert prompt across turns; weather suffix
      // varies and stays uncached.
      system: [
        { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
        ...(weatherSuffix ? [{ type: 'text' as const, text: weatherSuffix }] : []),
      ],
      messages: messages.slice(-MAX_MESSAGES),
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    return NextResponse.json({ reply: text });
  } catch (err) {
    console.error('[assistant POST]', err);
    return NextResponse.json({ error: 'AI unavailable' }, { status: 500 });
  }
}
