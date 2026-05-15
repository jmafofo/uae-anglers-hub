/**
 * POST /api/pollution
 *
 * Analyses a water photo for pollution indicators using Claude Vision.
 * Moved server-side so the Anthropic API key is never bundled in the
 * Ocean Sentinel APK/IPA.
 *
 * Body (JSON):
 *   imageBase64   string   — base64-encoded image (no data: prefix)
 *   mimeType?     string   — default "image/jpeg"
 *   latitude?     number   — capture location (for context)
 *   longitude?    number   — capture location
 *
 * Response:
 *   {
 *     detected:        boolean
 *     overallScore:    number        (0–1)
 *     pollutants:      PollutantResult[]
 *     recommendations: Recommendation[]
 *     assessment:      string
 *   }
 *
 * Auth: Bearer token required (prevents anonymous abuse of vision API).
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { requireAuth } from '@/lib/api-auth';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an environmental scientist specialising in marine water-quality assessment for the UAE / Arabian Gulf region. Analyse water photos objectively and conservatively — only flag pollution when there is clear visual evidence.`;

const ANALYSIS_PROMPT = `Analyse this water photo for signs of pollution. The image may show coastal water, a beach, a harbour, or open sea.

Check for each of the following:
1. OIL_SHEEN — rainbow or iridescent film on the water surface
2. TURBIDITY — unusually cloudy, murky, or sediment-laden water
3. ALGAE_BLOOM — green, blue-green, or red discoloration from algae
4. PLASTIC_DEBRIS — visible plastic bags, bottles, foam, or other waste
5. CHEMICAL_STAIN — unnatural colour (orange, purple, black) suggesting chemical discharge

For each type assess:
- detected: true/false
- confidence: 0.0–1.0
- evidence: brief description of what you observed

Return ONLY valid JSON — no markdown, no commentary:
{
  "pollutants": [
    { "type": "oil_sheen",      "detected": false, "confidence": 0.0, "evidence": "" },
    { "type": "turbidity",      "detected": false, "confidence": 0.0, "evidence": "" },
    { "type": "algae_bloom",    "detected": false, "confidence": 0.0, "evidence": "" },
    { "type": "plastic_debris", "detected": false, "confidence": 0.0, "evidence": "" },
    { "type": "chemical_stain", "detected": false, "confidence": 0.0, "evidence": "" }
  ],
  "overall_assessment": "Brief 1–2 sentence summary of the water quality."
}`;

export async function POST(req: NextRequest) {
  // Auth required — vision calls are expensive
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const imageBase64 = body.imageBase64 as string | undefined;
  const mimeType   = (body.mimeType as string | undefined) ?? 'image/jpeg';

  if (!imageBase64) {
    return NextResponse.json({ error: 'imageBase64 is required' }, { status: 400 });
  }

  // Call Claude Vision
  let message;
  try {
    message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType as 'image/jpeg', data: imageBase64 },
          },
          { type: 'text', text: ANALYSIS_PROMPT },
        ],
      }],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Claude API error';
    console.error('[pollution POST] Claude error:', msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const rawText = (message.content[0] as { type: string; text?: string })?.text ?? '';

  let parsed: {
    pollutants: Array<{ type: string; detected: boolean; confidence: number; evidence: string }>;
    overall_assessment: string;
  };
  try {
    const clean = rawText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    parsed = JSON.parse(clean);
  } catch {
    console.error('[pollution POST] JSON parse failed:', rawText.slice(0, 200));
    return NextResponse.json({ error: 'Could not parse analysis result' }, { status: 502 });
  }

  const detectedPollutants = (parsed.pollutants ?? []).filter(p => p.detected);
  const overallScore = detectedPollutants.length > 0
    ? detectedPollutants.reduce((sum, p) => sum + (p.confidence ?? 0), 0) / detectedPollutants.length
    : 0;

  return NextResponse.json({
    detected:     detectedPollutants.length > 0,
    overallScore,
    pollutants:   detectedPollutants,
    assessment:   parsed.overall_assessment ?? '',
  });
}
