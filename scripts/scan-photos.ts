/**
 * Scans public/spot-photos/ and writes lib/local-photos.json
 * so the site knows which spots have real local photos available.
 *
 * Run after adding new photos:
 *   npm run scan-photos
 */

import * as fs from 'fs';
import * as path from 'path';

const PHOTOS_DIR = path.join(process.cwd(), 'public', 'spot-photos');
const OUTPUT_PATH = path.join(process.cwd(), 'lib', 'local-photos.json');

const SUPPORTED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

interface LocalPhotos {
  /** slug → array of public URL paths, first entry is the hero/card image */
  [slug: string]: string[];
}

function main() {
  if (!fs.existsSync(PHOTOS_DIR)) {
    console.error(`❌  Folder not found: ${PHOTOS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(PHOTOS_DIR).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return SUPPORTED_EXTS.has(ext) && !f.startsWith('.');
  });

  // Group files by slug
  // Naming: slug.jpg (main), slug-2.jpg, slug-3.jpg … (extras)
  // Also accept underscores — normalise to hyphens automatically
  const grouped: Record<string, string[]> = {};

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    // Normalise underscores → hyphens so both conventions work
    const base = path.basename(file, ext).replace(/_/g, '-');

    // Match "slug-N" where N is a number — extra photos
    const multiMatch = base.match(/^(.+)-(\d+)$/);
    const slug = multiMatch ? multiMatch[1] : base;

    if (!grouped[slug]) grouped[slug] = [];
    grouped[slug].push(file);
  }

  // Sort each group: main image first (no number suffix), then -2, -3 …
  const result: LocalPhotos = {};
  for (const [slug, fileList] of Object.entries(grouped)) {
    fileList.sort((a, b) => {
      const aBase = path.basename(a, path.extname(a));
      const bBase = path.basename(b, path.extname(b));
      const aIsMain = aBase === slug;
      const bIsMain = bBase === slug;
      if (aIsMain) return -1;
      if (bIsMain) return 1;
      return aBase.localeCompare(bBase);
    });
    result[slug] = fileList.map((f) => `/spot-photos/${f}`);
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2));

  const spotCount = Object.keys(result).length;
  const photoCount = Object.values(result).flat().length;
  console.log(`✅  Scanned ${photoCount} photo(s) across ${spotCount} spot(s).`);
  console.log(`📄  Written to lib/local-photos.json`);
  console.log('');

  // Pretty print what was found
  for (const [slug, photos] of Object.entries(result)) {
    console.log(`  ${slug}  (${photos.length} photo${photos.length > 1 ? 's' : ''})`);
    for (const p of photos) console.log(`    ${p}`);
  }
}

main();
