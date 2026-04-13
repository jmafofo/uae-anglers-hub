/**
 * POST /api/identify
 *
 * Upgraded fish identification:
 * - Claude Sonnet vision model (much better accuracy than Haiku)
 * - GPS-aware: filters species list to the correct UAE coast
 * - Returns top-3 candidates with confidence percentages
 * - Morphological feature descriptions for each candidate
 *
 * Body (JSON):
 *   imageUrl?    string   — publicly accessible URL
 *   imageBase64? string   — base64-encoded image (no data: prefix)
 *   mimeType?    string   — default "image/jpeg"
 *   latitude?    number   — capture location
 *   longitude?   number   — capture location
 *
 * Response (identified):
 *   { status, species, confidence, confidence_pct, candidates[], location_context, image_quality }
 *
 * Response (unnamed):
 *   { status, unnamed_key, confidence, reasoning, location_context }
 *
 * Auth: Bearer token required
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ImageBlockParam } from '@anthropic-ai/sdk/resources/messages';
import Anthropic from '@anthropic-ai/sdk';
import { requireAuth, getUserSupabase } from '@/lib/api-auth';
import { fishSpecies, type FishSpecies } from '@/lib/species';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Geography helpers ─────────────────────────────────────────────────────────

/** Rough UAE coast detection based on longitude.
 *  Persian Gulf: west/north coast, lon < 56.4
 *  Gulf of Oman: east coast, lon >= 56.4
 *  Returns null if coordinates are outside the UAE bounding box.
 */
function detectCoast(lat: number, lng: number): 'Persian Gulf' | 'Gulf of Oman' | null {
  if (lat < 22 || lat > 27 || lng < 50 || lng > 60) return null;
  return lng < 56.4 ? 'Persian Gulf' : 'Gulf of Oman';
}

/** Filter species to those known in the capture location's coastal zone. */
function getSpeciesForLocation(lat?: number, lng?: number): FishSpecies[] {
  if (lat == null || lng == null) return fishSpecies;
  const coast = detectCoast(lat, lng);
  if (!coast) return fishSpecies; // outside UAE — use full list
  return fishSpecies.filter(s => s.coast === coast || s.coast === 'Both');
}

/** Human-readable location context for the prompt. */
function buildLocationContext(lat?: number, lng?: number): string {
  if (lat == null || lng == null) return '';
  const coast = detectCoast(lat, lng);
  const region = coast ?? 'UAE waters';
  return `Capture location: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E — ${region}`;
}

// ── Unnamed key generator ─────────────────────────────────────────────────────

async function generateUnnamedKey(token: string): Promise<string> {
  const sb = getUserSupabase(token);
  const { count } = await sb
    .from('catches')
    .select('*', { count: 'exact', head: true })
    .eq('identification_status', 'unnamed');
  const n = ((count ?? 0) + 1).toString().padStart(4, '0');
  return `unnamed_${n}`;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: {
    imageUrl?: string;
    imageBase64?: string;
    mimeType?: string;
    latitude?: number;
    longitude?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { imageUrl, imageBase64, mimeType = 'image/jpeg', latitude, longitude } = body;

  if (!imageUrl && !imageBase64) {
    return NextResponse.json(
      { error: 'Provide either imageUrl or imageBase64' },
      { status: 400 },
    );
  }

  // ── Build GPS-filtered species context ────────────────────────────────────
  const relevantSpecies = getSpeciesForLocation(latitude, longitude);
  const coast = latitude != null && longitude != null ? detectCoast(latitude, longitude) : null;
  const locationCtx = buildLocationContext(latitude, longitude);

  const speciesRef = relevantSpecies
    .map(s =>
      `• ${s.name} (${s.scientificName}) | local: ${s.localName} | ${s.habitatCategory} | ${s.coast}`,
    )
    .join('\n');

  // ── System prompt ─────────────────────────────────────────────────────────
  const systemPrompt = `You are a senior marine biologist specialising in UAE and Arabian Gulf fish species.
Identify the fish in the photo from the species list below. Respond ONLY with valid JSON.

${locationCtx ? locationCtx + '\n' : ''}${coast ? `Focus on ${coast} species — the angler is fishing in this region.\n` : ''}
Known UAE species (${relevantSpecies.length} species):
${speciesRef}

Response schema — return your top 3 candidates in descending confidence order:
{
  "candidates": [
    {
      "matched": true | false,
      "species_name": "<exact name from list, or null>",
      "scientific_name": "<scientific name, or null>",
      "confidence": "high" | "medium" | "low",
      "confidence_pct": <0.00–1.00>,
      "key_features": "<2-3 visual features: fin shape, body profile, coloration, markings>",
      "reasoning": "<one concise sentence>"
    }
  ],
  "overall_confidence": "high" | "medium" | "low",
  "image_quality": "good" | "acceptable" | "poor",
  "notes": "<any relevant observation, or null>"
}

Rules:
- Only set matched=true when confident the species appears in the list above
- Always provide up to 3 candidates even if confidence is low — alternatives help curation
- If truly unidentifiable, return one candidate with matched=false
- Never invent species names not in the list
- Consider: fin count/shape, body depth ratio, caudal fin shape, lateral line, colour bands/spots
- UAE fish may differ from textbook photos due to age, sex, season, or turbid water`;

  // ── Image block ───────────────────────────────────────────────────────────
  const validMime = (mimeType ?? 'image/jpeg') as
    | 'image/jpeg'
    | 'image/png'
    | 'image/gif'
    | 'image/webp';

  const imageBlock: ImageBlockParam = imageBase64
    ? { type: 'image', source: { type: 'base64', media_type: validMime, data: imageBase64 } }
    : { type: 'image', source: { type: 'url', url: imageUrl! } };

  // ── Claude Sonnet Vision ──────────────────────────────────────────────────
  let raw: string;
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            imageBlock,
            {
              type: 'text',
              text: 'Identify this fish. Provide top 3 species candidates with visual evidence. JSON only.',
            },
          ],
        },
      ],
    });
    raw = response.content[0].type === 'text' ? response.content[0].text : '';
  } catch (err) {
    console.error('[identify] Claude error:', err);
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 502 });
  }

  // ── Parse response ────────────────────────────────────────────────────────
  let parsed: {
    candidates: Array<{
      matched: boolean;
      species_name: string | null;
      scientific_name: string | null;
      confidence: string;
      confidence_pct: number;
      key_features?: string;
      reasoning: string;
    }>;
    overall_confidence: string;
    image_quality?: string;
    notes?: string | null;
  };

  try {
    const clean = raw.replace(/```(?:json)?/g, '').trim();
    parsed = JSON.parse(clean);
  } catch {
    console.error('[identify] Failed to parse Claude response:', raw);
    return NextResponse.json({ error: 'AI returned unreadable response' }, { status: 502 });
  }

  // ── Resolve candidates → species objects ──────────────────────────────────
  const CONF_FALLBACK: Record<string, number> = { high: 0.85, medium: 0.60, low: 0.30 };

  const resolvedCandidates = (parsed.candidates ?? [])
    .map((c, idx) => {
      if (!c.matched || !c.species_name) return null;

      const species = fishSpecies.find(
        s =>
          s.name.toLowerCase() === c.species_name!.toLowerCase() ||
          s.scientificName.toLowerCase() === (c.scientific_name ?? '').toLowerCase(),
      );
      if (!species) return null;

      return {
        species,
        confidence: c.confidence ?? 'low',
        confidence_pct: c.confidence_pct ?? CONF_FALLBACK[c.confidence] ?? 0.30,
        key_features: c.key_features ?? null,
        reasoning: c.reasoning ?? '',
        rank: idx + 1,
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  // ── Return identified result ──────────────────────────────────────────────
  if (resolvedCandidates.length > 0) {
    const top = resolvedCandidates[0];
    return NextResponse.json({
      status:           'identified',
      // Primary fields — backward compatible with older mobile clients
      species:          top.species,
      confidence:       top.confidence,
      confidence_pct:   top.confidence_pct,
      reasoning:        top.reasoning,
      // Extended fields — used by updated mobile clients
      candidates:       resolvedCandidates,
      location_context: coast ? `${coast}, UAE` : null,
      image_quality:    parsed.image_quality ?? null,
      notes:            parsed.notes ?? null,
    });
  }

  // ── No match — generate unnamed key ──────────────────────────────────────
  const unnamed_key = await generateUnnamedKey(auth.token);
  return NextResponse.json({
    status:           'unnamed',
    unnamed_key,
    confidence:       parsed.overall_confidence ?? 'low',
    reasoning:        parsed.candidates?.[0]?.reasoning ?? 'Species not found in UAE database',
    location_context: coast ? `${coast}, UAE` : null,
    image_quality:    parsed.image_quality ?? null,
    notes:            parsed.notes ?? null,
  });
}
