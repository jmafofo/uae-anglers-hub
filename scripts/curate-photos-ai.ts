/**
 * Round 3 — AI-curated photo sweep.
 *
 * For each photoless species: fetch Commons candidates (JPEG only — real
 * photographs, never illustrations), then have Claude Haiku vision grade
 * each one for identification use:
 *   - is it a real photograph (not a drawing/painting/scan)?
 *   - is the whole fish visible in side profile?
 *   - quality 1–5 for AI identification reference
 *
 * Output (sorted best-first): scripts/output/photo-review-round3.html + .json
 * Run: npx tsx scripts/curate-photos-ai.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import { fishSpecies } from '../lib/species';
import photos from '../lib/species-images';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const UA = 'UAEAnglersHub-ContentFix/1.0 (contact@uaeangler.com)';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const BAD_TITLE = /taxiderm|museum|skeleton|drawing|painting|map|diagram|logo|stamp|coin|egg|larva|aquarium|illustration|plate|print|engraving|sketch/i;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface Candidate {
  slug: string;
  label: string;
  title: string;
  thumbUrl: string;
  fullUrl: string;
  license: string;
  artist: string;
  descriptionUrl: string;
  mime: string;
  aiScore?: number;
  aiIsPhoto?: boolean;
  aiSideView?: boolean;
  aiNote?: string;
}

interface CommonsPage {
  title: string;
  imageinfo?: Array<{
    thumburl?: string;
    url: string;
    descriptionurl: string;
    mime?: string;
    extmetadata?: { LicenseShortName?: { value: string }; Artist?: { value: string } };
  }>;
}

async function searchCommons(query: string, limit: number): Promise<CommonsPage[]> {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json' +
    `&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=${limit}` +
    '&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=400';
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return [];
  const data = await res.json();
  return Object.values(data.query?.pages ?? {}) as CommonsPage[];
}

const stripHtml = (v: string) => v.replace(/<[^>]*>/g, '').trim();

async function gradeWithAI(c: Candidate, thumbB64: string): Promise<void> {
  const res = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 150,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: thumbB64 } },
        {
          type: 'text',
          text: `For a fish-identification reference database, grade this image. Reply with JSON only: {"is_photo": boolean (false for drawings, paintings, scans of illustrations, cartoons), "side_view": boolean (whole fish visible from the side, head-to-tail), "score": 1-5 (5 = crisp side-profile photo, whole fish, plain background), "note": "<max 8 words>"}`,
        },
      ],
    }],
  });
  const text = res.content[0].type === 'text' ? res.content[0].text : '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return;
  try {
    const parsed = JSON.parse(match[0]);
    c.aiIsPhoto = Boolean(parsed.is_photo);
    c.aiSideView = Boolean(parsed.side_view);
    c.aiScore = Number(parsed.score) || 0;
    c.aiNote = String(parsed.note ?? '');
  } catch { /* leave ungraded */ }
}

async function main() {
  const missing = fishSpecies.filter((s) => !photos[s.slug] || photos[s.slug].length === 0);
  console.log(`round 3: ${missing.length} species still photoless`);
  const candidates: Candidate[] = [];

  // 1. Gather JPEG-only candidates
  for (const s of missing) {
    const genus = (s.scientificName.split(' ')[0] ?? '').toLowerCase();
    const pages = await searchCommons(`"${s.scientificName}"`, 5);
    await sleep(250);
    let taken = 0;
    for (const page of pages) {
      if (taken >= 3) break;
      const info = page.imageinfo?.[0];
      if (!info?.thumburl) continue;
      if (info.mime !== 'image/jpeg') continue; // photographs only
      if (genus && !page.title.toLowerCase().includes(genus)) continue;
      if (BAD_TITLE.test(page.title)) continue;
      candidates.push({
        slug: s.slug,
        label: `${s.name} (${s.scientificName})`,
        title: page.title,
        thumbUrl: info.thumburl,
        fullUrl: info.url,
        license: stripHtml(info.extmetadata?.LicenseShortName?.value ?? 'unknown'),
        artist: stripHtml(info.extmetadata?.Artist?.value ?? 'unknown'),
        descriptionUrl: info.descriptionurl,
        mime: info.mime,
      });
      taken++;
    }
  }
  console.log(`jpeg candidates: ${candidates.length} — grading with AI…`);

  // 2. AI grading
  let graded = 0;
  for (const c of candidates) {
    try {
      const res = await fetch(c.thumbUrl, { headers: { 'User-Agent': UA } });
      if (!res.ok) continue;
      const b64 = Buffer.from(await res.arrayBuffer()).toString('base64');
      await gradeWithAI(c, b64);
      graded++;
      if (graded % 10 === 0) console.log(`  graded ${graded}/${candidates.length}`);
    } catch { /* skip */ }
    await sleep(150);
  }

  // 3. Sort: real photos, side view, score desc
  candidates.sort((a, b) =>
    Number(b.aiIsPhoto ?? false) - Number(a.aiIsPhoto ?? false) ||
    Number(b.aiSideView ?? false) - Number(a.aiSideView ?? false) ||
    (b.aiScore ?? 0) - (a.aiScore ?? 0),
  );

  const outDir = path.join(process.cwd(), 'scripts/output');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'photo-candidates-round3.json'), JSON.stringify(candidates, null, 2));

  const cards = candidates.map((c, i) => {
    const badge = c.aiIsPhoto === false
      ? '<span class="bad">✗ drawing/render</span>'
      : c.aiSideView
        ? `<span class="good">✓ side profile · ${c.aiScore}/5</span>`
        : `<span class="meh">photo · not side view · ${c.aiScore ?? '?'}/5</span>`;
    return `  <div class="card ${c.aiIsPhoto === false ? 'reject' : ''}">
    <img src="${c.thumbUrl}" loading="lazy" alt="">
    <div class="meta">
      <strong>🐟 ${c.label}</strong>
      ${badge}${c.aiNote ? `<span class="note">"${c.aiNote}"</span>` : ''}
      <a href="${c.descriptionUrl}" target="_blank" rel="noopener">${c.title.slice(0, 60)}</a>
      <span>${c.license} · © ${c.artist}</span>
      <label><input type="checkbox" data-i="${i}" ${c.aiIsPhoto === false ? 'disabled' : ''}> approve</label>
    </div>
  </div>`;
  }).join('\n');

  fs.writeFileSync(path.join(outDir, 'photo-review-round3.html'),
    `<!doctype html><meta charset="utf-8"><title>Round 3 — AI-graded photo candidates</title>
<style>
 body{font:15px system-ui;background:#f7f9fa;color:#18333f;max-width:1100px;margin:2rem auto;padding:0 1rem}
 .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1rem}
 .card{background:#fff;border:1px solid #e1e7eb;border-radius:.8rem;overflow:hidden}
 .card.reject{opacity:.45}
 .card img{width:100%;height:160px;object-fit:cover;background:#eef2f3}
 .meta{padding:.7rem;display:flex;flex-direction:column;gap:.3rem;font-size:.8rem;color:#5b6b77}
 .meta strong{color:#18333f;font-size:.9rem}a{color:#23675e;word-break:break-all}
 .good{color:#205b52;font-weight:600}.meh{color:#8a651c}.bad{color:#b3261e;font-weight:600}.note{opacity:.7}
 button{margin:1rem 0;padding:.8rem 1.4rem;border:0;border-radius:.6rem;background:#23675e;color:#fff;font-weight:600;cursor:pointer}
</style>
<h1>Round 3 — AI-graded candidates (${candidates.length})</h1>
<p>Sorted best-first. AI has pre-flagged drawings and non-side-view shots — <strong>approve only side-profile whole-fish photos</strong> like the gold-standard examples. The AI grade is advice; your eye decides.</p>
<button onclick="exportApproved()">Export approved JSON</button>
<div class="grid">
${cards}
</div>
<script>
const candidates=${JSON.stringify(candidates.map((c) => ({ kind: 'species', slug: c.slug, fullUrl: c.fullUrl, license: c.license, artist: c.artist, descriptionUrl: c.descriptionUrl })))};
function exportApproved(){
  const approved=[...document.querySelectorAll('input:checked')].map(el=>candidates[el.dataset.i]);
  const blob=new Blob([JSON.stringify(approved,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='photo-approved-round3.json';a.click();
}
</script>`);

  const good = candidates.filter((c) => c.aiIsPhoto && c.aiSideView).length;
  console.log(`\ndone: ${candidates.length} candidates, ${good} AI-rated side-profile photos`);
  console.log(`→ scripts/output/photo-review-round3.html`);
}

main().catch((e) => { console.error(e); process.exit(1); });
