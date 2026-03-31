/**
 * Scans public/fish-species/ and writes lib/species-photos.json
 * so the species pages know which fish have real photos available.
 *
 * Run after adding new photos:
 *   npm run scan-species-photos
 *
 * ─── HOW TO NAME YOUR PHOTO FILES ───────────────────────────────────────────
 * Preferred: use the exact species slug as the filename.
 *   Examples: hammour.jpg, sultan-ibrahim.jpg, cobia.jpg
 *
 * Multiple photos for one species: add a number suffix.
 *   Examples: hammour.jpg, hammour-2.jpg, hammour-3.jpg
 *
 * If you can't rename the file, add an entry to ALIAS_MAP below.
 * ────────────────────────────────────────────────────────────────────────────
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── ALIAS MAP ───────────────────────────────────────────────────────────────
// Map any filename (without extension, hyphens normalised) → species slug.
// Add a new line here whenever you add a photo with a non-slug filename.
const ALIAS_MAP: Record<string, string> = {
  // Current photos
  'emperor-fish':          'spangled-emperor',   // Lethrinus nebulosus
  'farsh':                 'streaked-spinefoot',  // Siganus javus (Safi/Rabbitfish)
  'black-spot-snapper':    'one-spot-snapper',    // Lutjanus monostigma
  'black-spot-snapper-2':  'one-spot-snapper',
  'black-spot-snapper-alt':'one-spot-snapper',
  'giant-moray':           'giant-moray',
  'giant-moray-eel':       'giant-moray',
  'mahi-mahi':             'mahi-mahi',
  'dolphinfish':           'mahi-mahi',
  'dorado':                'mahi-mahi',
  'jesh':                  'queenfish',           // Scomberoides commersonnianus
  'queenfish':             'queenfish',
  'terapon-jarbua':        'largescaled-therapon', // Terapon jarbua
  'golden-trevally':       'golden-trevally',     // already slug but just in case

  // Common alternative names — extend as needed
  'hammour-fish':          'hammour',
  'grouper':               'hammour',
  'kingfish':              'indian-mackerel',
  'safi':                  'streaked-spinefoot',
  'sheri':                 'long-finned-sea-bream',
  'shaari':                'long-finned-sea-bream',
  'sha3ri':                'long-finned-sea-bream',
  'farida':                'spangled-emperor',
  'sultan-ibrahim-fish':   'sultan-ibrahim',
  'trevally':              'golden-trevally',
  'remora-fish':           'remora',
  'battat':                'indian-flathead',
  'dhanis':                'silver-bream',
  'safi-fish':             'streaked-spinefoot',
  'parrotfish':            'blue-barred-parrotfish',
  'pufferfish':            'starry-blowfish',
  'blowfish':              'starry-blowfish',
  'boxfish':               'blue-spotted-boxfish',
  'catfish':               'giant-catfish',
  'stingray':              'whiptail-stingray',
  'lionfish-fish':         'lionfish',
  'dick-al-bahr':          'lionfish',
  'banner-fish':           'pennant-coralfish',
  'bannerfish':            'pennant-coralfish',
  'mojarra':               'common-mojarra',
  'mullet':                'large-scale-mullet',
  'mullet-bluespot':       'bluespot-mullet',
  'therapon':              'largescaled-therapon',
  'wrasse':                'red-breasted-wrasse',
  'damselfish':            'sergeant-major-damselfish',
  'sergeant-major':        'sergeant-major-damselfish',
  'cephalopholis':         'blue-spotted-grouper',
  'snapper':               'one-spot-snapper',
  'threadfin-bream':       'sultan-ibrahim',
  'mackerel':              'indian-mackerel',
  'flathead':              'indian-flathead',
};
// ─────────────────────────────────────────────────────────────────────────────

const PHOTOS_DIR  = path.join(process.cwd(), 'public', 'fish-species');
const OUTPUT_PATH = path.join(process.cwd(), 'lib', 'species-photos.json');
const SUPPORTED   = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

interface SpeciesPhotos {
  /** slug → array of public URL paths, first entry is the hero/card image */
  [slug: string]: string[];
}

function normalise(name: string): string {
  return name.toLowerCase().replace(/_/g, '-').replace(/\s+/g, '-');
}

function main() {
  if (!fs.existsSync(PHOTOS_DIR)) {
    console.error(`❌  Folder not found: ${PHOTOS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(PHOTOS_DIR).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return SUPPORTED.has(ext) && !f.startsWith('.');
  });

  const grouped: Record<string, string[]> = {};
  const unmatched: string[] = [];

  for (const file of files) {
    const ext  = path.extname(file).toLowerCase();
    const base = normalise(path.basename(file, ext));

    // Strip trailing number suffix to find the base slug
    const multiMatch = base.match(/^(.+)-(\d+)$/);
    const rawSlug    = multiMatch ? multiMatch[1] : base;

    // Resolve slug: direct match first, then alias map
    const slug = rawSlug in ALIAS_MAP ? ALIAS_MAP[rawSlug] : rawSlug;

    if (!grouped[slug]) grouped[slug] = [];
    grouped[slug].push(file);
  }

  // Sort each group: main image first (no number suffix), then -2, -3 …
  const result: SpeciesPhotos = {};
  for (const [slug, fileList] of Object.entries(grouped)) {
    fileList.sort((a, b) => {
      const aBase = normalise(path.basename(a, path.extname(a)));
      const bBase = normalise(path.basename(b, path.extname(b)));
      // The "main" file is the one whose normalised base == slug (or alias resolves to slug)
      const resolveBase = (s: string) => {
        const m = s.match(/^(.+)-(\d+)$/);
        return m ? (ALIAS_MAP[m[1]] ?? m[1]) : (ALIAS_MAP[s] ?? s);
      };
      const aIsMain = resolveBase(aBase) === slug && !aBase.match(/-\d+$/);
      const bIsMain = resolveBase(bBase) === slug && !bBase.match(/-\d+$/);
      if (aIsMain) return -1;
      if (bIsMain) return 1;
      return aBase.localeCompare(bBase);
    });
    result[slug] = fileList.map((f) => `/fish-species/${f}`);
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2));

  const slugCount  = Object.keys(result).length;
  const photoCount = Object.values(result).flat().length;
  console.log(`\n✅  Scanned ${photoCount} photo(s) across ${slugCount} species.\n`);
  console.log(`📄  Written to lib/species-photos.json\n`);

  for (const [slug, photos] of Object.entries(result)) {
    console.log(`  ${slug}  (${photos.length} photo${photos.length > 1 ? 's' : ''})`);
    for (const p of photos) console.log(`    ${p}`);
  }

  if (unmatched.length > 0) {
    console.log(`\n⚠️   Unmatched files (add to ALIAS_MAP):`);
    for (const f of unmatched) console.log(`    ${f}`);
  }
}

main();
