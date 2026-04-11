/**
 * POST /api/identify
 *
 * Accepts a fish photo (URL or base64) and uses Claude Vision to match it
 * against the UAE species database. Returns the matched species or generates
 * an unnamed_XXXX key if no match is found — ready for curator review.
 *
 * Body (JSON):
 *   imageUrl?    string   — publicly accessible URL of the image
 *   imageBase64? string   — base64-encoded image data (without data: prefix)
 *   mimeType?    string   — e.g. "image/jpeg" (default: "image/jpeg")
 *
 * Response:
 *   { status: 'identified', species: FishSpecies, confidence: string }
 *   { status: 'unnamed', unnamed_key: string, confidence: string }
 *
 * Auth: Bearer token required
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ImageBlockParam } from '@anthropic-ai/sdk/resources/messages';
import Anthropic from '@anthropic-ai/sdk';
import { requireAuth, getUserSupabase } from '@/lib/api-auth';
import { fishSpecies } from '@/lib/species';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Compact species list for the prompt — names + scientific names only
const SPECIES_REFERENCE = fishSpecies
  .map((s) => `• ${s.name} (${s.scientificName}) — local: ${s.localName}`)
  .join('\n');

const IDENTIFY_SYSTEM = `You are a marine biologist specialising in UAE and Arabian Gulf fish species.
Given a photo of a fish, identify it from the list below. Respond ONLY with valid JSON.

Known UAE species:
${SPECIES_REFERENCE}

Response schema:
{
  "matched": true | false,
  "species_name": "<exact name from list above, or null>",
  "scientific_name": "<scientific name, or null>",
  "confidence": "high" | "medium" | "low",
  "reasoning": "<one sentence>"
}

Rules:
- Only return matched=true if you are confident this is a species in the list.
- If unsure, or the species is not in the list, return matched=false.
- Never invent species names outside the list.`;

/** Generate a short unique unnamed key, e.g. unnamed_0042 */
async function generateUnnamedKey(token: string): Promise<string> {
  const sb = getUserSupabase(token);
  const { count } = await sb
    .from('catches')
    .select('*', { count: 'exact', head: true })
    .eq('identification_status', 'unnamed');
  const n = ((count ?? 0) + 1).toString().padStart(4, '0');
  return `unnamed_${n}`;
}

export async function POST(req: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  // ── Parse body ───────────────────────────────────────────────
  let body: { imageUrl?: string; imageBase64?: string; mimeType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { imageUrl, imageBase64, mimeType = 'image/jpeg' } = body;

  if (!imageUrl && !imageBase64) {
    return NextResponse.json(
      { error: 'Provide either imageUrl or imageBase64' },
      { status: 400 },
    );
  }

  // ── Build Claude image content block ─────────────────────────
  const validMime = (mimeType ?? 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  const imageBlock: ImageBlockParam = imageBase64
    ? { type: 'image', source: { type: 'base64', media_type: validMime, data: imageBase64 } }
    : { type: 'image', source: { type: 'url', url: imageUrl! } };

  // ── Run Claude Vision ─────────────────────────────────────────
  let raw: string;
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: IDENTIFY_SYSTEM,
      messages: [
        {
          role: 'user',
          content: [
            imageBlock,
            { type: 'text', text: 'Identify this fish. Respond with JSON only.' },
          ],
        },
      ],
    });
    raw = response.content[0].type === 'text' ? response.content[0].text : '';
  } catch (err) {
    console.error('[identify] Claude error:', err);
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 502 });
  }

  // ── Parse Claude response ─────────────────────────────────────
  let parsed: {
    matched: boolean;
    species_name: string | null;
    scientific_name: string | null;
    confidence: string;
    reasoning: string;
  };
  try {
    // Strip markdown code fences if Claude wrapped the JSON
    const clean = raw.replace(/```(?:json)?/g, '').trim();
    parsed = JSON.parse(clean);
  } catch {
    console.error('[identify] Failed to parse Claude response:', raw);
    return NextResponse.json({ error: 'AI returned unreadable response' }, { status: 502 });
  }

  // ── Matched species ───────────────────────────────────────────
  if (parsed.matched && parsed.species_name) {
    const species = fishSpecies.find(
      (s) =>
        s.name.toLowerCase() === parsed.species_name!.toLowerCase() ||
        s.scientificName.toLowerCase() === (parsed.scientific_name ?? '').toLowerCase(),
    );
    if (species) {
      return NextResponse.json({
        status: 'identified',
        species,
        confidence: parsed.confidence,
        reasoning: parsed.reasoning,
      });
    }
  }

  // ── No match — generate unnamed key ──────────────────────────
  const unnamed_key = await generateUnnamedKey(auth.token);
  return NextResponse.json({
    status: 'unnamed',
    unnamed_key,
    confidence: parsed.confidence ?? 'low',
    reasoning: parsed.reasoning ?? 'Species not found in UAE database',
  });
}
