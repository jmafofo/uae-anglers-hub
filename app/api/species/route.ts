/**
 * GET /api/species
 *
 * Returns the full UAE species catalogue. The mobile app calls this once
 * on first launch and caches it locally for fully offline operation.
 *
 * Query params:
 *   slug?    string  — return a single species by slug
 *   search?  string  — filter by name / scientific name / local name (case-insensitive)
 *   habitat? string  — filter by habitatCategory (Reef | Pelagic | Demersal | Coastal | Open Ocean)
 *   coast?   string  — 'Persian Gulf' | 'Gulf of Oman' | 'Both'
 *
 * No auth required — public endpoint.
 *
 * Response:
 *   { species: FishSpecies[], total: number, version: string }
 *   or { species: FishSpecies } for single slug lookup
 */

import { NextRequest, NextResponse } from 'next/server';
import { fishSpecies } from '@/lib/species';

// Cache-control: species list changes rarely — cache for 24h on CDN
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
};

// Increment this when species data changes to bust mobile caches
const SPECIES_VERSION = '2024-moccae-v1';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug    = searchParams.get('slug');
  const search  = searchParams.get('search')?.toLowerCase().trim();
  const habitat = searchParams.get('habitat')?.toLowerCase();
  const coast   = searchParams.get('coast');

  // ── Single species by slug ────────────────────────────────────
  if (slug) {
    const species = fishSpecies.find((s) => s.slug === slug);
    if (!species) {
      return NextResponse.json({ error: 'Species not found' }, { status: 404 });
    }
    return NextResponse.json({ species }, { headers: CACHE_HEADERS });
  }

  // ── Filtered list ─────────────────────────────────────────────
  let results = fishSpecies;

  if (search) {
    results = results.filter(
      (s) =>
        s.name.toLowerCase().includes(search) ||
        s.scientificName.toLowerCase().includes(search) ||
        s.localName.toLowerCase().includes(search) ||
        s.family.toLowerCase().includes(search),
    );
  }

  if (habitat) {
    results = results.filter(
      (s) => s.habitatCategory.toLowerCase() === habitat,
    );
  }

  if (coast) {
    results = results.filter(
      (s) => s.coast === coast || s.coast === 'Both',
    );
  }

  return NextResponse.json(
    { species: results, total: results.length, version: SPECIES_VERSION },
    { headers: CACHE_HEADERS },
  );
}
