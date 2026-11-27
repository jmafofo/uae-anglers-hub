/**
 * Content-gap audit: which species lack photos/metadata, which spots
 * lack real photos or have low-precision coordinates.
 * Run: npx tsx scripts/audit-content-gaps.ts
 */
import { fishSpecies } from '../lib/species';
import photos from '../lib/species-images';
import { fishingSpots, getSpotImage } from '../lib/spots';
import localPhotos from '../lib/local-photos.json';

let missingPhoto: string[] = [];
let thin: Array<{ slug: string; gaps: string[] }> = [];

for (const s of fishSpecies) {
  if (!photos[s.slug] || photos[s.slug].length === 0) missingPhoto.push(s.slug);
  const gaps: string[] = [];
  if (!s.description || s.description.length < 80) gaps.push('description');
  if (!s.funFacts || s.funFacts.length === 0) gaps.push('funFacts');
  if (s.maxSizeCm == null) gaps.push('maxSizeCm');
  if (s.maxWeightKg == null) gaps.push('maxWeightKg');
  if (s.conservationStatus === 'Not verified') gaps.push('conservation');
  if (s.edibility === 'Not verified') gaps.push('edibility');
  if (!s.morphology) gaps.push('morphology');
  if (!s.sources || s.sources.length === 0) gaps.push('sources');
  if (!s.localName || s.localName === s.name) gaps.push('localName');
  if (gaps.length) thin.push({ slug: s.slug, gaps });
}

console.log(`SPECIES: ${fishSpecies.length} total`);
console.log(`  no photo: ${missingPhoto.length}`);
console.log(`  ${missingPhoto.join(', ')}`);
console.log(`  metadata gaps: ${thin.length} species`);
for (const t of thin) console.log(`    ${t.slug}: ${t.gaps.join(', ')}`);

console.log('\nSPOTS:');
const noRealPhoto: string[] = [];
const lowPrecision: string[] = [];
for (const spot of fishingSpots) {
  const img = getSpotImage(spot.slug, spot.accessType);
  const isFallback = img.includes('images.unsplash.com');
  const hasLocal = Array.isArray((localPhotos as Record<string, string[]>)[spot.slug]);
  if (isFallback && !hasLocal) noRealPhoto.push(spot.slug);
  // coordinate precision: count decimals; <3 decimals ≈ >100m error
  const dec = (n: number) => (String(n).split('.')[1] ?? '').length;
  if (Math.min(dec(spot.latitude), dec(spot.longitude)) < 3) {
    lowPrecision.push(`${spot.slug} (${spot.latitude}, ${spot.longitude})`);
  }
}
console.log(`  total: ${fishingSpots.length}`);
console.log(`  generic fallback photo only: ${noRealPhoto.length}`);
console.log(`  ${noRealPhoto.join(', ')}`);
console.log(`  low-precision coordinates (<3 decimals): ${lowPrecision.length}`);
console.log(`  ${lowPrecision.join('\n  ')}`);
