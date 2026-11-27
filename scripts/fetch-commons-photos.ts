/**
 * Wikimedia Commons photo pipeline — REVIEW MODE.
 *
 * Finds candidate photos for species and spots that currently have none,
 * but does NOT apply anything automatically: the project has been burned
 * by mismatched specimen photos before (see the `excluded` set in
 * lib/species-images.ts), so every candidate goes through human review.
 *
 * Outputs:
 *   scripts/output/photo-candidates.json  — structured candidates
 *   scripts/output/photo-review.html      — open in a browser to review
 *
 * Run: npx tsx scripts/fetch-commons-photos.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { fishSpecies } from '../lib/species';
import photos from '../lib/species-images';
import { fishingSpots, getSpotImage } from '../lib/spots';

const UA = 'UAEAnglersHub-ContentFix/1.0 (contact@uaeangler.com)';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const BAD_TITLE = /taxiderm|museum|skeleton|drawing|painting|map|diagram|logo|stamp|coin|egg|larva|aquarium/i;

interface Candidate {
  kind: 'species' | 'spot';
  slug: string;
  label: string;
  query: string;
  title: string;
  thumbUrl: string;
  fullUrl: string;
  license: string;
  artist: string;
  descriptionUrl: string;
}

interface CommonsPage {
  title: string;
  imageinfo?: Array<{
    thumburl?: string;
    url: string;
    descriptionurl: string;
    extmetadata?: {
      LicenseShortName?: { value: string };
      Artist?: { value: string };
    };
  }>;
}

async function searchCommons(query: string, limit: number): Promise<Candidate['title'][] extends never ? never : CommonsPage[]> {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json' +
    `&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=${limit}` +
    '&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=400';
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return [];
  const data = await res.json();
  return Object.values(data.query?.pages ?? {}) as CommonsPage[];
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, '').trim();
}

async function main() {
  const candidates: Candidate[] = [];

  // ── Species without photos ──
  const missingSpecies = fishSpecies.filter((s) => !photos[s.slug] || photos[s.slug].length === 0);
  console.log(`species missing photos: ${missingSpecies.length}`);
  for (const s of missingSpecies) {
    const genus = s.scientificName.split(' ')[0]?.toLowerCase() ?? '';
    const pages = await searchCommons(`"${s.scientificName}"`, 3);
    await sleep(300);
    for (const page of pages) {
      const info = page.imageinfo?.[0];
      if (!info?.thumburl) continue;
      if (genus && !page.title.toLowerCase().includes(genus)) continue;
      if (BAD_TITLE.test(page.title)) continue;
      candidates.push({
        kind: 'species',
        slug: s.slug,
        label: `${s.name} (${s.scientificName})`,
        query: s.scientificName,
        title: page.title,
        thumbUrl: info.thumburl,
        fullUrl: info.url,
        license: stripHtml(info.extmetadata?.LicenseShortName?.value ?? 'unknown'),
        artist: stripHtml(info.extmetadata?.Artist?.value ?? 'unknown'),
        descriptionUrl: info.descriptionurl,
      });
      break; // top acceptable candidate only
    }
  }

  // ── Spots on generic fallback photos ──
  const missingSpots = fishingSpots.filter((s) => getSpotImage(s.slug, s.accessType).includes('images.unsplash.com'));
  console.log(`spots missing real photos: ${missingSpots.length}`);
  for (const s of missingSpots) {
    const query = `${s.name} ${s.emirate}`;
    const pages = await searchCommons(query, 3);
    await sleep(300);
    for (const page of pages) {
      const info = page.imageinfo?.[0];
      if (!info?.thumburl) continue;
      if (BAD_TITLE.test(page.title)) continue;
      candidates.push({
        kind: 'spot',
        slug: s.slug,
        label: `${s.name}, ${s.emirate}`,
        query,
        title: page.title,
        thumbUrl: info.thumburl,
        fullUrl: info.url,
        license: stripHtml(info.extmetadata?.LicenseShortName?.value ?? 'unknown'),
        artist: stripHtml(info.extmetadata?.Artist?.value ?? 'unknown'),
        descriptionUrl: info.descriptionurl,
      });
      break;
    }
  }

  const outDir = path.join(process.cwd(), 'scripts/output');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'photo-candidates.json'), JSON.stringify(candidates, null, 2));

  const cards = candidates
    .map(
      (c, i) => `  <div class="card">
    <img src="${c.thumbUrl}" loading="lazy" alt="">
    <div class="meta">
      <strong>${c.kind === 'species' ? '🐟' : '📍'} ${c.label}</strong>
      <span class="slug">${c.slug}</span>
      <a href="${c.descriptionUrl}" target="_blank" rel="noopener">${c.title}</a>
      <span>${c.license} · © ${c.artist}</span>
      <label><input type="checkbox" data-i="${i}"> approve</label>
    </div>
  </div>`,
    )
    .join('\n');

  fs.writeFileSync(
    path.join(outDir, 'photo-review.html'),
    `<!doctype html><meta charset="utf-8"><title>Photo candidates — UAE Anglers</title>
<style>
 body{font:15px system-ui;background:#f7f9fa;color:#18333f;max-width:1100px;margin:2rem auto;padding:0 1rem}
 .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1rem}
 .card{background:#fff;border:1px solid #e1e7eb;border-radius:.8rem;overflow:hidden}
 .card img{width:100%;height:160px;object-fit:cover;background:#eef2f3}
 .meta{padding:.7rem;display:flex;flex-direction:column;gap:.3rem;font-size:.8rem;color:#5b6b77}
 .meta strong{color:#18333f;font-size:.9rem}.slug{opacity:.6}a{color:#23675e;word-break:break-all}
 button{margin:1rem 0;padding:.8rem 1.4rem;border:0;border-radius:.6rem;background:#23675e;color:#fff;font-weight:600;cursor:pointer}
</style>
<h1>Photo candidates (${candidates.length})</h1>
<p>Review each image, tick <em>approve</em> for correct ones, then click Export. Apply with the follow-up script.</p>
<button onclick="exportApproved()">Export approved JSON</button>
<div class="grid">
${cards}
</div>
<script>
const candidates=${JSON.stringify(candidates.map((c) => ({ kind: c.kind, slug: c.slug, fullUrl: c.fullUrl, license: c.license, artist: c.artist, descriptionUrl: c.descriptionUrl })))};
function exportApproved(){
  const approved=[...document.querySelectorAll('input:checked')].map(el=>candidates[el.dataset.i]);
  const blob=new Blob([JSON.stringify(approved,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='photo-approved.json';a.click();
}
</script>`,
  );

  const speciesHits = candidates.filter((c) => c.kind === 'species').length;
  const spotHits = candidates.filter((c) => c.kind === 'spot').length;
  console.log(`\ncandidates found: ${candidates.length} (species ${speciesHits}, spots ${spotHits})`);
  console.log(`→ scripts/output/photo-review.html (open in a browser to approve)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
