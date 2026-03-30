/**
 * Run once to populate lib/spot-photos.json with real Google Places photo references.
 * Usage: npx tsx scripts/fetch-spot-photos.ts
 * Requires: GOOGLE_MAPS_API_KEY in .env.local
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!API_KEY) {
  console.error('❌  GOOGLE_MAPS_API_KEY not found in .env.local');
  process.exit(1);
}

const spots = [
  { slug: 'al-garhoud-bridge',        name: 'Al Garhoud Bridge',          emirate: 'Dubai',           lat: 25.2524, lng: 55.3425 },
  { slug: 'al-maktoum-bridge',         name: 'Al Maktoum Bridge',          emirate: 'Dubai',           lat: 25.2660, lng: 55.3140 },
  { slug: 'dubai-creek',               name: 'Dubai Creek',                emirate: 'Dubai',           lat: 25.2631, lng: 55.3289 },
  { slug: 'jumeirah-beach',            name: 'Jumeirah Beach',             emirate: 'Dubai',           lat: 25.2048, lng: 55.2708 },
  { slug: 'the-palm-jumeirah',         name: 'The Palm Jumeirah',          emirate: 'Dubai',           lat: 25.1124, lng: 55.1390 },
  { slug: 'jebel-ali-beach',           name: 'Jebel Ali Beach',            emirate: 'Dubai',           lat: 25.0157, lng: 55.0207 },
  { slug: 'dubai-marina',              name: 'Dubai Marina',               emirate: 'Dubai',           lat: 25.0804, lng: 55.1398 },
  { slug: 'safa-park-lake',            name: 'Safa Park',                  emirate: 'Dubai',           lat: 25.1893, lng: 55.2572 },
  { slug: 'al-seef-district',          name: 'Al Seef Dubai Creek',        emirate: 'Dubai',           lat: 25.2640, lng: 55.2970 },
  { slug: 'umm-suqeim-beach',          name: 'Umm Suqeim Beach',           emirate: 'Dubai',           lat: 25.1426, lng: 55.1876 },
  { slug: 'al-aryam-island',           name: 'Al Aryam Island',            emirate: 'Abu Dhabi',       lat: 24.3068, lng: 54.2266 },
  { slug: 'mina-breakwater',           name: 'Mina Port Abu Dhabi',        emirate: 'Abu Dhabi',       lat: 24.5000, lng: 54.3700 },
  { slug: 'marina-mall-island',        name: 'Marina Mall Abu Dhabi',      emirate: 'Abu Dhabi',       lat: 24.4764, lng: 54.3219 },
  { slug: 'salam-corniche',            name: 'Abu Dhabi Corniche',         emirate: 'Abu Dhabi',       lat: 24.4900, lng: 54.3600 },
  { slug: 'mussafah-bridge',           name: 'Mussafah Bridge',            emirate: 'Abu Dhabi',       lat: 24.3600, lng: 54.5100 },
  { slug: 'al-bateen',                 name: 'Al Bateen Beach Abu Dhabi',  emirate: 'Abu Dhabi',       lat: 24.4600, lng: 54.3200 },
  { slug: 'mina-zayed',                name: 'Mina Zayed Port',            emirate: 'Abu Dhabi',       lat: 24.5200, lng: 54.3900 },
  { slug: 'al-khan-lagoon',            name: 'Al Khan Lagoon Sharjah',     emirate: 'Sharjah',         lat: 25.3211, lng: 55.3831 },
  { slug: 'al-hamriyah-port',          name: 'Al Hamriyah Port Sharjah',   emirate: 'Sharjah',         lat: 25.4200, lng: 55.5100 },
  { slug: 'khor-kalba',                name: 'Khor Kalba Mangrove',        emirate: 'Sharjah',         lat: 25.0550, lng: 56.3550 },
  { slug: 'marbella-resort-area',      name: 'Marbella Resort Sharjah',    emirate: 'Sharjah',         lat: 25.2900, lng: 55.3000 },
  { slug: 'sharjah-corniche',          name: 'Sharjah Corniche',           emirate: 'Sharjah',         lat: 25.3500, lng: 55.3900 },
  { slug: 'ajman-marina',              name: 'Ajman Marina',               emirate: 'Ajman',           lat: 25.4050, lng: 55.4350 },
  { slug: 'ajman-corniche',            name: 'Ajman Corniche',             emirate: 'Ajman',           lat: 25.4100, lng: 55.4400 },
  { slug: 'ajman-beach',               name: 'Ajman Beach',                emirate: 'Ajman',           lat: 25.4050, lng: 55.4450 },
  { slug: 'uaq-coastline',             name: 'Umm Al Quwain Corniche',     emirate: 'Umm Al Quwain',   lat: 25.5644, lng: 55.5550 },
  { slug: 'uaq-lagoons',               name: 'Umm Al Quwain Lagoon',       emirate: 'Umm Al Quwain',   lat: 25.5500, lng: 55.5300 },
  { slug: 'al-hamra-marina',           name: 'Al Hamra Marina Ras Al Khaimah', emirate: 'Ras Al Khaimah', lat: 25.6800, lng: 55.7700 },
  { slug: 'al-marjan-island',          name: 'Al Marjan Island',           emirate: 'Ras Al Khaimah', lat: 25.6850, lng: 55.7950 },
  { slug: 'al-jazeera-al-hamra-beach', name: 'Al Jazeera Al Hamra',        emirate: 'Ras Al Khaimah', lat: 25.6950, lng: 55.8150 },
  { slug: 'al-rams-beach',             name: 'Al Rams Beach',              emirate: 'Ras Al Khaimah', lat: 25.8600, lng: 56.0400 },
  { slug: 'mina-al-arab-lagoon',       name: 'Mina Al Arab Lagoon',        emirate: 'Ras Al Khaimah', lat: 25.6700, lng: 55.7600 },
  { slug: 'dhayah-bay',                name: 'Dhayah Fort Ras Al Khaimah', emirate: 'Ras Al Khaimah', lat: 25.7500, lng: 55.9000 },
  { slug: 'khor-al-beidah',            name: 'Khor Al Beidah Mangrove',    emirate: 'Ras Al Khaimah', lat: 25.7000, lng: 55.8500 },
  { slug: 'rak-offshore',              name: 'Ras Al Khaimah offshore',    emirate: 'Ras Al Khaimah', lat: 25.8000, lng: 56.2000 },
  { slug: 'flamingo-beach',            name: 'Flamingo Beach Ras Al Khaimah', emirate: 'Ras Al Khaimah', lat: 25.6500, lng: 55.7300 },
  { slug: 'fujairah-marine-club',      name: 'Fujairah Marine Club',       emirate: 'Fujairah',        lat: 25.1150, lng: 56.3456 },
  { slug: 'fujairah-port-area',        name: 'Fujairah Port',              emirate: 'Fujairah',        lat: 25.1250, lng: 56.3550 },
  { slug: 'dibba',                     name: 'Dibba Fishing Village',      emirate: 'Fujairah',        lat: 25.6200, lng: 56.2700 },
  { slug: 'khor-fakkan',               name: 'Khor Fakkan Bay',            emirate: 'Fujairah',        lat: 25.3350, lng: 56.3420 },
  { slug: 'fujairah-beaches',          name: 'Fujairah Beach',             emirate: 'Fujairah',        lat: 25.1200, lng: 56.3250 },
];

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPhotoRef(
  slug: string,
  name: string,
  emirate: string,
  lat: number,
  lng: number
): Promise<string | null> {
  const query = `${name} ${emirate} UAE`;
  const url =
    `https://maps.googleapis.com/maps/api/place/findplacefromtext/json` +
    `?input=${encodeURIComponent(query)}` +
    `&inputtype=textquery` +
    `&fields=photos,name` +
    `&locationbias=circle:20000@${lat},${lng}` +
    `&key=${API_KEY}`;

  try {
    const res = await fetch(url);
    const data = (await res.json()) as {
      status: string;
      candidates?: { name?: string; photos?: { photo_reference: string }[] }[];
    };

    if (data.status !== 'OK') {
      console.log(`  ⚠  Status: ${data.status}`);
      return null;
    }

    const ref = data.candidates?.[0]?.photos?.[0]?.photo_reference ?? null;
    return ref;
  } catch (err) {
    console.error(`  ❌ Fetch error: ${err}`);
    return null;
  }
}

async function main() {
  const outputPath = path.join(process.cwd(), 'lib', 'spot-photos.json');

  // Load existing data so we can resume if interrupted
  let existing: Record<string, string> = {};
  if (fs.existsSync(outputPath)) {
    existing = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
    console.log(`Loaded ${Object.keys(existing).length} existing entries — will skip those.\n`);
  }

  const results: Record<string, string> = { ...existing };
  let fetched = 0;
  let skipped = 0;
  let failed = 0;

  for (const spot of spots) {
    if (existing[spot.slug]) {
      skipped++;
      continue;
    }

    process.stdout.write(`[${fetched + skipped + failed + 1}/${spots.length}] ${spot.name} ... `);
    const ref = await fetchPhotoRef(spot.slug, spot.name, spot.emirate, spot.lat, spot.lng);

    if (ref) {
      results[spot.slug] = ref;
      fetched++;
      console.log('✓');
    } else {
      failed++;
      console.log('✗ no photo');
    }

    // Save incrementally in case of interruption
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    await sleep(250); // stay under rate limit
  }

  console.log(`\n✅  Done. ${fetched} fetched, ${skipped} skipped, ${failed} failed.`);
  console.log(`📄  Saved to lib/spot-photos.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
