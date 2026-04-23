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
import { getUserSupabase } from '@/lib/api-auth';
import { createClient } from '@supabase/supabase-js';
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
  // ── Optional auth — identification works for all users ────────────────────
  // Authenticated users get unnamed_key generation for catch logging.
  // Unauthenticated users (guests, offline anglers) can still identify fish.
  const authHeader = req.headers.get('authorization');
  let userToken: string | null = null;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    );
    const { data: { user } } = await sb.auth.getUser();
    if (user) userToken = token;
  }

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
  const systemPrompt = `You are a senior marine biologist specialising in the fish fauna of the UAE, Arabian Gulf, and Gulf of Oman. You have decades of field experience identifying fish from angler beach photos.
Identify the fish in the photo. Respond ONLY with valid JSON — no markdown, no text outside the JSON object.

${locationCtx ? locationCtx + '\n' : ''}${coast ? `Focus on ${coast} species — the angler is fishing in this region.\n` : ''}
━━━ CRITICAL FIELD CONDITIONS ━━━
UAE beach fishing photos are taken immediately after landing. The fish is typically:
• Alive and thrashing on wet sand — coated in a layer of sand, mud, or algae
• Lying at an awkward angle; may be partially buried
• Shot quickly with a phone camera in harsh light

CONSEQUENCE: Colour, scale pattern, lateral stripe colour, and fin colour are COMPLETELY UNRELIABLE and must be IGNORED.
You MUST identify from body structure and geometry alone.

━━━ STEP 1 — TRIAGE WHAT IS VISIBLE ━━━
Note which body parts you can actually resolve through the dirt/sand before classifying:
• RELIABLE EVEN WHEN DIRTY: body outline/silhouette, caudal fin shape, mouth shape, snout profile, eye position, body depth-to-length ratio
• OFTEN VISIBLE: dorsal fin count and general shape, head profile, pectoral fin length
• UNRELIABLE WHEN DIRTY: scale pattern, stripe colour, fin colour, belly markings

━━━ STEP 2 — MEASURE THE SILHOUETTE ━━━
Estimate body depth / standard length (depth at deepest point ÷ length excluding tail):
  • > 0.45 → very deep/disc-shaped (deep Sparidae, Siganidae)
  • 0.30–0.45 → moderately deep (Haemulidae, most Lethrinidae, Serranidae)
  • 0.15–0.30 → elongated/fusiform (Mugilidae, Carangidae, Scombridae)
  • < 0.15 → very elongated (Sphyraenidae, Trichiuridae)
Also note: head size (large vs normal), caudal peduncle (slender vs thick), dorsal hump position.

━━━ STEP 3 — DIRT-RESISTANT STRUCTURAL FEATURES ━━━
Observe what IS visible:
• Snout: blunt/rounded vs pointed/conical vs depressed/flat
• Mouth: terminal/inferior/superior; size relative to head
• Eye: large vs small; high on head vs mid-lateral
• Dorsal fin: single continuous vs two separate fins; notched or smooth
• Caudal fin: deeply forked / lunate / emarginate / truncate / rounded — often mud-free
• Lateral line path: curves sharply downward (Carangidae), runs straight, or arched
• Preopercle edge: smooth vs serrated

━━━ STEP 4 — MATCH TO UAE SPECIES LIST ━━━
Known UAE species available for this region (${relevantSpecies.length} species):
${speciesRef}

Structural guide for common UAE families:
• Deep body (>0.45) + small mouth → Sparidae or Siganidae
• Moderate depth (0.30–0.45) + blunt snout + small inferior mouth → Haemulidae (Grunters)
• Moderate depth + long pointed snout + large mouth → Lethrinidae (Emperors)
• Moderate depth + large head + wide terminal mouth + rounded tail → Serranidae (Groupers)
• Elongated (0.15–0.30) + forked tail + lateral line curves down → Carangidae (Jacks/Trevally)
• Elongated + blunt head + thick fleshy lips → Mugilidae (Mullets)
• Very elongated (<0.15) + pointed snout + two separated dorsal fins → Sphyraenidae (Barracuda)
• Very elongated + tapered + two dorsal fins close together → Scombridae/Scomberomorus (Mackerel)
• Depressed flat head + ridged body → Platycephalidae (Flathead)

━━━ RESPONSE SCHEMA ━━━
Return top 5 candidates in descending confidence order:
{
  "candidates": [
    {
      "matched": true | false,
      "species_name": "<exact name from species list above, or null>",
      "scientific_name": "<scientific name, or null>",
      "confidence": "high" | "medium" | "low",
      "confidence_pct": <0.00–1.00>,
      "key_features": ["body depth ratio estimate", "snout/mouth description", "fin structure observed", "caudal fin shape"],
      "reasoning": "<Walk through: which features were visible vs obscured, the proportion estimate, snout/mouth/fin details, and exactly why that points to this species over the alternatives.>"
    }
  ],
  "overall_confidence": "high" | "medium" | "low",
  "image_quality": "good" | "acceptable" | "poor",
  "notes": "<any relevant observation, or null>"
}

Rules:
- Only set matched=true when confident the species name appears in the list above
- Always provide up to 5 candidates — alternatives help expert curation
- If unidentifiable, return one candidate with matched=false
- Never invent species names not in the list
- key_features MUST be an array of strings, not a single string
- confidence_pct > 0.85 only when snout, mouth, body proportions, AND caudal fin are all clearly visible
- If fish is heavily sand-caked and only silhouette is visible, cap confidence_pct at 0.60
- Never let colour alone drive the ranking`;

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
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            imageBlock,
            {
              type: 'text',
              text: 'This fish was just landed on a UAE beach — it may be coated in wet sand or mud. Identify it using structural features only (body proportions, snout, mouth, fin shapes). Return top 5 candidates as JSON only.',
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
      key_features?: string | string[];
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

      // Normalise key_features to string[] regardless of what Claude returns
      const rawFeatures = c.key_features;
      const key_features: string[] | null = Array.isArray(rawFeatures)
        ? rawFeatures
        : typeof rawFeatures === 'string' && rawFeatures.trim()
          ? rawFeatures.split(/[·•\n]/).map(f => f.trim()).filter(Boolean)
          : null;

      return {
        species,
        confidence: c.confidence ?? 'low',
        confidence_pct: c.confidence_pct ?? CONF_FALLBACK[c.confidence] ?? 0.30,
        key_features,
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

  // ── No match — generate unnamed key (authenticated users only) ───────────
  const unnamed_key = userToken ? await generateUnnamedKey(userToken) : null;
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
