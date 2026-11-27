import original from './species-photos.json';
import habitat from './species-habitat-photos.json';

export const habitatPhotoCredits: Record<string, { src: string; author: string; license: string; licenseUrl: string; source: string; caption: string }> = habitat;
// Unsuitable specimen, out-of-water, aquarium, watermarked, or mismatched photos.
// hammour, golden-trevally, smallscaled-therapon and areolate-grouper were
// removed 2026-11-27 — they now have reviewed, approved photos.
const excluded = new Set([
  'giant-catfish', 'large-scale-mullet', 'silver-grunt',
  'sultan-ibrahim', 'yellowfin-seabream', 'common-mojarra',
  'epaulet-grouper',
]);
const photos: Record<string, string[]> = Object.fromEntries(Object.entries(original)
  .filter(([slug]) => !excluded.has(slug))
  .map(([slug, paths]) => [slug, paths.filter(path => path !== '/fish-species/jesh.jpg')]));
for (const [slug, photo] of Object.entries(habitat)) photos[slug] = [photo.src];
export default photos;
