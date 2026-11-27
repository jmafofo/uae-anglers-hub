/**
 * Apply approved photo candidates:
 *   npx tsx scripts/apply-approved-photos.ts "/path/to/photo-approved.json"
 *
 * Downloads each approved image, normalizes to JPEG ≤1200px into
 * public/fish-species/commons/ (species) or public/spot-photos/commons/
 * (spots), then wires them into lib/species-photos.json and
 * lib/local-photos.json, and records attribution in lib/commons-credits.json.
 */
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const UA = 'UAEAnglersHub-ContentFix/1.0 (contact@uaeangler.com)';

interface Approved {
  kind: 'species' | 'spot';
  slug: string;
  fullUrl: string;
  license: string;
  artist: string;
  descriptionUrl: string;
}

// Known duplicates: same underlying image approved for two slugs — the
// pipeline matched both Plectorhinchus species to one photo. Apply to the
// correct one only.
const SKIP = new Set(['sordid-rubberlip']);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function download(url: string, dest: string) {
  const clean = url.replace(/\?utm_.*$/, '');
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(clean, { headers: { 'User-Agent': UA } });
    if (res.ok) {
      fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
      return;
    }
    if (res.status !== 429) throw new Error(`HTTP ${res.status} for ${clean}`);
    await sleep(4000 * (attempt + 1));
  }
  throw new Error(`HTTP 429 (rate-limited) for ${clean}`);
}

async function main() {
  const input = process.argv[2];
  if (!input) throw new Error('usage: apply-approved-photos.ts <photo-approved.json>');
  const approved = JSON.parse(fs.readFileSync(input, 'utf8')) as Approved[];
  console.log(`applying ${approved.length} approved photos…`);

  const speciesPhotosPath = path.join(process.cwd(), 'lib/species-photos.json');
  const localPhotosPath = path.join(process.cwd(), 'lib/local-photos.json');
  const creditsPath = path.join(process.cwd(), 'lib/commons-credits.json');
  const speciesPhotos: Record<string, string[]> = JSON.parse(fs.readFileSync(speciesPhotosPath, 'utf8'));
  const localPhotos: Record<string, string[]> = JSON.parse(fs.readFileSync(localPhotosPath, 'utf8'));
  const credits: Record<string, object> = fs.existsSync(creditsPath)
    ? JSON.parse(fs.readFileSync(creditsPath, 'utf8'))
    : {};

  let applied = 0;
  for (const item of approved) {
    if (SKIP.has(item.slug)) {
      console.log(`  ✗ ${item.slug}: SKIPPED (wrong-species duplicate — see notes)`);
      continue;
    }
    const isSpecies = item.kind === 'species';
    const dir = path.join(process.cwd(), isSpecies ? 'public/fish-species/commons' : 'public/spot-photos/commons');
    fs.mkdirSync(dir, { recursive: true });
    const rel = `${isSpecies ? '/fish-species/commons' : '/spot-photos/commons'}/${item.slug}.jpg`;
    const tmp = `/tmp/photo-${item.slug}`;
    try {
      await download(item.fullUrl, tmp);
      execFileSync('sips', ['-Z', '1200', '-s', 'format', 'jpeg', '-s', 'formatOptions', '82', tmp, '--out', path.join(dir, `${item.slug}.jpg`)], { stdio: 'pipe' });
    } catch (e) {
      console.log(`  ✗ ${item.slug}: download/convert failed — ${(e as Error).message}`);
      continue;
    }

    if (isSpecies) {
      speciesPhotos[item.slug] = [...new Set([...(speciesPhotos[item.slug] ?? []), rel])];
    } else {
      localPhotos[item.slug] = [...new Set([...(localPhotos[item.slug] ?? []), rel])];
    }
    credits[item.slug] = {
      kind: item.kind,
      src: rel,
      author: item.artist.replace(/\s+/g, ' ').slice(0, 200),
      license: item.license,
      licenseUrl: item.descriptionUrl,
      source: 'Wikimedia Commons',
    };
    applied++;
    console.log(`  ✓ ${item.kind}/${item.slug}`);
    await sleep(1500); // be polite to upload.wikimedia.org
  }

  fs.writeFileSync(speciesPhotosPath, JSON.stringify(speciesPhotos, null, 2) + '\n');
  fs.writeFileSync(localPhotosPath, JSON.stringify(localPhotos, null, 2) + '\n');
  fs.writeFileSync(creditsPath, JSON.stringify(credits, null, 2) + '\n');
  console.log(`\napplied ${applied}/${approved.length}. Credits → lib/commons-credits.json`);
}

main().catch((e) => { console.error(e); process.exit(1); });
