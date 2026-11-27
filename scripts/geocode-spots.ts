/**
 * Geocode low-precision fishing-spot coordinates via OSM Nominatim (free,
 * no key). High-confidence fixes (result within 2 km of the current
 * coordinate) are applied to lib/spots.ts in place; everything else lands
 * in scripts/output/geocode-review.json for a human decision.
 *
 * Run: npx tsx scripts/geocode-spots.ts
 * Nominatim policy: 1 request/second, identifiable User-Agent.
 */
import * as fs from 'fs';
import * as path from 'path';
import { fishingSpots } from '../lib/spots';

const UA = 'UAEAnglersHub-ContentFix/1.0 (contact@uaeangler.com)';
const AUTO_APPLY_MAX_KM = 2;

const decimals = (n: number) => (String(n).split('.')[1] ?? '').length;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  importance: number;
}

async function geocode(query: string): Promise<NominatimResult | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return null;
  const data = (await res.json()) as NominatimResult[];
  return data[0] ?? null;
}

async function main() {
  const targets = fishingSpots.filter(
    (s) => Math.min(decimals(s.latitude), decimals(s.longitude)) < 3,
  );
  console.log(`geocoding ${targets.length} low-precision spots (1 req/s)…\n`);

  const applied: string[] = [];
  const review: object[] = [];
  let source = fs.readFileSync(path.join(process.cwd(), 'lib/spots.ts'), 'utf8');

  for (const spot of targets) {
    const query = `${spot.name}, ${spot.emirate}, United Arab Emirates`;
    const hit = await geocode(query);
    await sleep(1100);
    if (!hit) {
      review.push({ slug: spot.slug, reason: 'no geocode result', query });
      console.log(`  ? ${spot.slug}: no result`);
      continue;
    }
    const lat = Number(hit.lat);
    const lng = Number(hit.lon);
    const distKm = haversineKm(spot.latitude, spot.longitude, lat, lng);
    const confident = distKm <= AUTO_APPLY_MAX_KM;
    console.log(
      `  ${confident ? '✓' : '!'} ${spot.slug}: (${spot.latitude}, ${spot.longitude}) → (${lat}, ${lng})  ${distKm.toFixed(2)} km  [${hit.display_name.slice(0, 70)}]`,
    );
    if (confident) {
      // Replace the coordinates on this spot's rawSpots line (matched by name).
      const lineRe = new RegExp(
        `(\\{ name: '${spot.name.replace(/'/g, "\\'")}', latitude: )[0-9.]+(, longitude: )[0-9.]+`,
      );
      const next = source.replace(lineRe, `$1${lat}$2${lng}`);
      if (next === source) {
        review.push({ slug: spot.slug, reason: 'source line not matched', query });
        continue;
      }
      source = next;
      applied.push(spot.slug);
    } else {
      review.push({ slug: spot.slug, reason: `result ${distKm.toFixed(1)} km away`, query, proposed: { lat, lng }, current: { lat: spot.latitude, lng: spot.longitude }, displayName: hit.display_name });
    }
  }

  fs.writeFileSync(path.join(process.cwd(), 'lib/spots.ts'), source);
  fs.mkdirSync(path.join(process.cwd(), 'scripts/output'), { recursive: true });
  fs.writeFileSync(
    path.join(process.cwd(), 'scripts/output/geocode-review.json'),
    JSON.stringify(review, null, 2),
  );
  console.log(`\napplied: ${applied.length} — ${applied.join(', ')}`);
  console.log(`needs review: ${review.length} → scripts/output/geocode-review.json`);
}

main().catch((e) => { console.error(e); process.exit(1); });
