/**
 * Round 2 ID-grade photo sweep for species still without photos.
 * Looser queries than round 1 (unquoted scientific name, common+genus),
 * up to 2 candidates per species so review has a choice.
 * Output: scripts/output/photo-candidates-round2.json + photo-review-round2.html
 * Run: npx tsx scripts/fetch-commons-photos-round2.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { fishSpecies } from '../lib/species';
import photos from '../lib/species-images';

const UA = 'UAEAnglersHub-ContentFix/1.0 (contact@uaeangler.com)';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const BAD_TITLE = /taxiderm|museum|skeleton|drawing|painting|map|diagram|logo|stamp|coin|egg|larva|aquarium|illustration|plate|print|engraving/i;

interface Candidate {
  kind: 'species';
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
    extmetadata?: { LicenseShortName?: { value: string }; Artist?: { value: string } };
  }>;
}

async function searchCommons(query: string, limit: number): Promise<CommonsPage[]> {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json' +
    `&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=${limit}` +
    '&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=400';
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return [];
  const data = await res.json();
  return Object.values(data.query?.pages ?? {}) as CommonsPage[];
}

const stripHtml = (v: string) => v.replace(/<[^>]*>/g, '').trim();

async function main() {
  const missing = fishSpecies.filter((s) => !photos[s.slug] || photos[s.slug].length === 0);
  console.log(`round 2: ${missing.length} species still photoless`);
  const candidates: Candidate[] = [];

  for (const s of missing) {
    const genus = (s.scientificName.split(' ')[0] ?? '').toLowerCase();
    const queries = [`${s.scientificName} fish`, `${s.name} ${genus}`];
    const seen = new Set<string>();
    outer: for (const q of queries) {
      const pages = await searchCommons(q, 4);
      await sleep(300);
      for (const page of pages) {
        if (candidates.filter((c) => c.slug === s.slug).length >= 2) break outer;
        const info = page.imageinfo?.[0];
        if (!info?.thumburl || seen.has(page.title)) continue;
        if (genus && !page.title.toLowerCase().includes(genus)) continue;
        if (BAD_TITLE.test(page.title)) continue;
        seen.add(page.title);
        candidates.push({
          kind: 'species',
          slug: s.slug,
          label: `${s.name} (${s.scientificName})`,
          query: q,
          title: page.title,
          thumbUrl: info.thumburl,
          fullUrl: info.url,
          license: stripHtml(info.extmetadata?.LicenseShortName?.value ?? 'unknown'),
          artist: stripHtml(info.extmetadata?.Artist?.value ?? 'unknown'),
          descriptionUrl: info.descriptionurl,
        });
      }
    }
  }

  const outDir = path.join(process.cwd(), 'scripts/output');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'photo-candidates-round2.json'), JSON.stringify(candidates, null, 2));

  const cards = candidates.map((c, i) => `  <div class="card">
    <img src="${c.thumbUrl}" loading="lazy" alt="">
    <div class="meta">
      <strong>🐟 ${c.label}</strong>
      <span class="slug">${c.slug}</span>
      <a href="${c.descriptionUrl}" target="_blank" rel="noopener">${c.title}</a>
      <span>${c.license} · © ${c.artist}</span>
      <label><input type="checkbox" data-i="${i}"> approve</label>
    </div>
  </div>`).join('\n');

  fs.writeFileSync(path.join(outDir, 'photo-review-round2.html'),
    `<!doctype html><meta charset="utf-8"><title>Round 2 photo candidates — UAE Anglers</title>
<style>
 body{font:15px system-ui;background:#f7f9fa;color:#18333f;max-width:1100px;margin:2rem auto;padding:0 1rem}
 .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1rem}
 .card{background:#fff;border:1px solid #e1e7eb;border-radius:.8rem;overflow:hidden}
 .card img{width:100%;height:160px;object-fit:cover;background:#eef2f3}
 .meta{padding:.7rem;display:flex;flex-direction:column;gap:.3rem;font-size:.8rem;color:#5b6b77}
 .meta strong{color:#18333f;font-size:.9rem}.slug{opacity:.6}a{color:#23675e;word-break:break-all}
 button{margin:1rem 0;padding:.8rem 1.4rem;border:0;border-radius:.6rem;background:#23675e;color:#fff;font-weight:600;cursor:pointer}
</style>
<h1>Round 2 photo candidates (${candidates.length})</h1>
<p>Identification-grade review: approve only photos where the <strong>whole fish is clearly visible from the side</strong> — fins, mouth and body shape readable. Reject anything ambiguous: a missing photo is better than a wrong one, because Ocean Sentinel learns from these.</p>
<button onclick="exportApproved()">Export approved JSON</button>
<div class="grid">
${cards}
</div>
<script>
const candidates=${JSON.stringify(candidates.map((c) => ({ kind: c.kind, slug: c.slug, fullUrl: c.fullUrl, license: c.license, artist: c.artist, descriptionUrl: c.descriptionUrl })))};
function exportApproved(){
  const approved=[...document.querySelectorAll('input:checked')].map(el=>candidates[el.dataset.i]);
  const blob=new Blob([JSON.stringify(approved,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='photo-approved-round2.json';a.click();
}
</script>`);

  console.log(`candidates: ${candidates.length} → scripts/output/photo-review-round2.html`);
}

main().catch((e) => { console.error(e); process.exit(1); });
