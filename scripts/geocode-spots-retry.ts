/**
 * Second-pass geocoding with better search names for spots Nominatim
 * couldn't find by their display name. Same rules as geocode-spots.ts.
 * Run: npx tsx scripts/geocode-spots-retry.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { fishingSpots } from '../lib/spots';

const UA = 'UAEAnglersHub-ContentFix/1.0 (contact@uaeangler.com)';
const AUTO_APPLY_MAX_KM = 2;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const RETRIES: Record<string, string> = {
  'mina-breakwater': 'Zayed Port, Abu Dhabi',
  'salam-corniche': 'Abu Dhabi Corniche',
  'al-hamriyah-port': 'Al Hamriyah, Sharjah',
  'marbella-resort-area': 'Marbella Resort, Sharjah',
  'uaq-lagoons': 'Khor Umm Al Quwain',
  'al-rams-beach': 'Al Rams, Ras Al Khaimah',
  'mina-al-arab-lagoon': 'Mina Al Arab, Ras Al Khaimah',
  'dhayah-bay': 'Dhayah, Ras Al Khaimah',
  'khor-al-beidah': 'Khor Al Beidah',
};

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

async function geocode(query: string) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return null;
  const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  return data[0] ?? null;
}

async function main() {
  let source = fs.readFileSync(path.join(process.cwd(), 'lib/spots.ts'), 'utf8');
  const reviewPath = path.join(process.cwd(), 'scripts/output/geocode-review.json');
  const review: Array<{ slug: string; reason: string }> = fs.existsSync(reviewPath)
    ? JSON.parse(fs.readFileSync(reviewPath, 'utf8'))
    : [];

  for (const [slug, query] of Object.entries(RETRIES)) {
    const spot = fishingSpots.find((s) => s.slug === slug);
    if (!spot) continue;
    const hit = await geocode(query);
    await sleep(1100);
    if (!hit) {
      console.log(`  ? ${slug}: still no result ("${query}")`);
      continue;
    }
    const lat = Number(hit.lat);
    const lng = Number(hit.lon);
    const distKm = haversineKm(spot.latitude, spot.longitude, lat, lng);
    const confident = distKm <= AUTO_APPLY_MAX_KM;
    console.log(`  ${confident ? '✓' : '!'} ${slug}: ${distKm.toFixed(2)} km → (${lat}, ${lng}) [${hit.display_name.slice(0, 60)}]`);
    if (confident) {
      const lineRe = new RegExp(
        `(\\{ name: '${spot.name.replace(/'/g, "\\'")}', latitude: )[0-9.]+(, longitude: )[0-9.]+`,
      );
      const next = source.replace(lineRe, `$1${lat}$2${lng}`);
      if (next !== source) {
        source = next;
        const idx = review.findIndex((r) => r.slug === slug);
        if (idx >= 0) review.splice(idx, 1);
      }
    } else {
      const idx = review.findIndex((r) => r.slug === slug);
      if (idx >= 0) review[idx] = { ...review[idx], reason: `retry: result ${distKm.toFixed(1)} km away ("${query}")` };
    }
  }

  fs.writeFileSync(path.join(process.cwd(), 'lib/spots.ts'), source);
  fs.writeFileSync(reviewPath, JSON.stringify(review, null, 2));
  console.log(`\nreview list now ${review.length} entries → scripts/output/geocode-review.json`);
}

main().catch((e) => { console.error(e); process.exit(1); });
