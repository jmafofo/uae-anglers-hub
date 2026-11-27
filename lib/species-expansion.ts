import type { FishSpecies } from './species';

const calendar = { title: 'MOCCAE Fishing Calendar 2021 — UAE occurrence and Arabic names', url: 'https://site.moccae.gov.ae/assets/download/d42a46e5/Fishing%20Calendar_2021.pdf.aspx' };
const fisheries = { title: 'Abu Dhabi fisheries monitoring study (2025)', url: 'https://www.mdpi.com/2071-1050/17/16/7467' };
const reviewedAt = 'November 2026';

// Local names can cover several species and vary between markets. Keep scientific
// names as the identity; transliterations are search aids, not separate taxa.
const names: Record<string, [string, string[]]> = {
  'hammour': ['هامور', ['Hamour', 'Hamoor', 'Hammour', 'الهامور']],
  'spangled-emperor': ['شعري', ['Sheri', 'Shaari', "Sha’ari", 'Shari', 'الشعري العربي']],
  'pink-ear-emperor': ['شخيلي', ['Shakhili', 'Shakhaili', 'الشخيلي']],
  'white-spotted-rabbitfish': ['صافي', ['Safi', 'Safee', 'الصافي', 'White-spotted spinefoot']],
  'painted-sweetlips': ['فرش', ['Farsh', 'Fersh', 'الفرش']],
  'orange-spotted-trevally': ['جش النعيمي', ['Jesh Naeemi', 'Jash Nuaimi', 'Flavocaranx bajad']],
  'spanish-mackerel': ['كنعد', ['Kingfish', 'King fish', 'Kanaad', 'Kanad', 'Kanad fish', 'الكنعد']],
  'golden-trevally': ['زريدي', ['Zuraidi', 'Zreidi', 'الزريدي']],
  'silver-bream': ['قابط', ['Qabit', 'Gabit', 'Goldlined seabream', 'Gold-lined seabream']],
  'black-seabream': ['فسكر', ['Faskar', 'Fasker', 'Two-bar seabream', 'Twobar seabream', 'Doublebar bream']],
  'malabar-blood-snapper': ['حمرا', ['Hamra', 'Hamrah']],
  'indian-mackerel': ['قرفا', ['Garfa', 'Gurfa', 'القرفا']],
  'long-finned-sea-bream': ['كوفر', ['Kofer', 'Kofar', 'Koffer', 'King soldierbream', 'الكوفر']],
  'queenfish': ['ضلع', ['Dhala', 'Dalaa', 'Talang queenfish', 'الضلع']],
  'longtail-tuna': ['قباب', ['Qabab', 'Gubab', 'القباب']],
  'mangrove-red-snapper': ['أم ضريس', ['Um Drais', 'Umm Drais', 'Mangrove jack', 'ام ضريس']],
  'silver-grunt': ['سنكسر', ['Senkesar', 'Naqroor', 'Nagroor']],
  'duskytail-grouper': ['سمان', ['Suman', 'Summan', 'السمان']],
  'spinycheek-grouper': ['ديسكو', ['Disco', 'الديسكو']],
  'coast-trevally': ['جش طمبر', ['Jesh Tambar', 'Coastal trevally']],
  'bluespot-mullet': ['بياح', ['Biyah', 'Biah', 'Byah', 'Moolgarda seheli']],
};

export const localNameUpdates: Record<string, Partial<FishSpecies>> = Object.fromEntries(
  Object.entries(names).map(([slug, [localName, aliases]]) => [slug, { localName, aliases, sources: [calendar] }]),
);
localNameUpdates['long-finned-sea-bream'] = {
  ...localNameUpdates['long-finned-sea-bream'], name: 'King Soldierbream (Kofer)',
  aliases: [...names['long-finned-sea-bream'][1], 'Long-finned sea bream'],
  description: 'Known in the UAE as Kofer, Argyrops spinifer is a sea bream listed on both coasts in the MOCCAE fishing calendar. Keep it distinct from Sheri, the spangled emperor (Lethrinus nebulosus). Its elongated dorsal spines are an important identification feature.',
};
localNameUpdates['black-seabream'] = {
  ...localNameUpdates['black-seabream'], name: 'Two-bar Seabream (Faskar)',
  description: 'Faskar is the UAE name listed for Acanthopagrus bifasciatus in the MOCCAE fishing calendar. It is a seabream, distinct from Safi, the white-spotted rabbitfish. Use its scientific name when comparing similar market names.',
};

const westCoast = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah'];
const allCoasts = [...westCoast, 'Fujairah'];
// Unknown measurements/statuses stay explicit instead of inventing values.
const defaults = {
  depth: 'Not verified', diet: 'Not verified', maxSizeCm: null, maxWeightKg: null,
  conservationStatus: 'Not verified', edibility: 'Not verified', dangerLevel: 'none',
  funFacts: [], reviewedAt,
} satisfies Partial<FishSpecies>;

export const additionalSpecies: FishSpecies[] = [
  {
    ...defaults, id: 'giant-trevally', slug: 'giant-trevally', name: 'Giant Trevally',
    localName: 'جش الفرو', aliases: ['GT', 'Giant kingfish', 'Jesh Al Farou', 'Jash Al Farou'],
    scientificName: 'Caranx ignobilis', family: 'Carangidae',
    habitat: 'Rocky and coral reefs, inshore sand flats and estuaries', habitatCategory: 'Pelagic',
    depth: '10–188 m', diet: 'Fish, cephalopods and crustaceans', maxSizeCm: 170,
    conservationStatus: 'Data Deficient', conservationScope: 'UAE national assessment, 2019',
    coast: 'Both', regions: allCoasts,
    description: 'A large trevally recorded throughout UAE waters. Adults may travel alone or in schools; juveniles use shallow sandy areas. The MOCCAE calendar lists it as Jesh Al Farou. The abbreviation GT is widely used by anglers.',
    sources: [calendar, { title: 'UAE National Red List — Caranx ignobilis (2019 assessment)', url: 'https://www.nationalredlist.org/node/36227' }],
  },
  {
    ...defaults, id: 'longnose-trevally', slug: 'longnose-trevally', name: 'Longnose Trevally',
    localName: 'جش الصال', aliases: ['Jesh Al Sal', 'Jash Al Sal', 'Largenose trevally', 'Carangoides chrysophrys'],
    scientificName: 'Platycaranx chrysophrys', family: 'Carangidae',
    habitat: 'Coastal reefs; juveniles in inshore waters and estuaries', habitatCategory: 'Coastal',
    depth: '10–90 m', maxSizeCm: 72, maxWeightKg: 4.4,
    conservationStatus: 'Least Concern', conservationScope: 'Global assessment, 2015',
    coast: 'Both', regions: allCoasts,
    description: 'Listed on both UAE coasts by MOCCAE under its former name Carangoides chrysophrys. The accepted genus is now Platycaranx. Often found in small groups around coastal reefs. The published maximum length is 72 cm fork length, measured to the fork of the tail.',
    sources: [calendar, { title: 'CSIRO — accepted name and taxonomy', url: 'https://www.cmar.csiro.au/caab/taxon_report.cfm?caab_code=37337011' }, { title: 'FishBase — Longnose trevally', url: 'https://www.fishbase.se/summary/Carangoides-chrysophrys.html' }],
  },
  {
    ...defaults, id: 'sordid-rubberlip', slug: 'sordid-rubberlip', name: 'Sordid Rubberlip',
    localName: 'ينم', aliases: ['Yenem', 'Yanam', 'Sordid sweetlips'],
    scientificName: 'Plectorhinchus sordidus', family: 'Haemulidae',
    habitat: 'Marine coastal waters', habitatCategory: 'Coastal',
    conservationStatus: 'Least Concern', conservationScope: 'Global IUCN status reported by Catalog of Fishes (2019)',
    coast: 'Both', regions: allCoasts,
    description: 'Yenem is listed on both UAE coasts in the MOCCAE fishing calendar. This rubberlip has thick fleshy lips and a grey body, with red colouring inside the mouth. It is a separate species from Plectorhinchus schotaf, which also appears in this guide.',
    sources: [calendar, { title: 'FAO — Sordid rubberlip identification sheet', url: 'https://www.fao.org/4/ad468e/AD468eEJ.pdf' }, { title: 'Catalog of Fishes — Plectorhinchus sordidus', url: 'https://researcharchive.calacademy.org/research/ichthyology/catalog/fishcatget.asp?spid=36095' }],
  },
  {
    ...defaults, id: 'blackbanded-trevally', slug: 'blackbanded-trevally', name: 'Blackbanded Trevally',
    localName: 'حلوايوه', aliases: ['Halwayoh', 'Halwayoo', 'Black-banded trevally', 'Blackbanded amberjack'],
    scientificName: 'Seriolina nigrofasciata', family: 'Carangidae',
    habitat: 'Marine waters of the UAE west coast', habitatCategory: 'Other',
    coast: 'Persian Gulf', regions: westCoast,
    description: 'Listed as Halwayoh in the MOCCAE west-coast fishing calendar. Despite the amberjack name sometimes used by anglers, this fish belongs to Seriolina and is distinct from the greater amberjack, Seriola dumerili. Further measurements and habitat details are awaiting verification.',
    sources: [calendar],
  },
  {
    ...defaults, id: 'gulf-parrotfish', slug: 'gulf-parrotfish', name: 'Gulf Parrotfish',
    localName: 'القين', aliases: ['Qain', 'Gain', 'Persian parrotfish'],
    scientificName: 'Scarus persicus', family: 'Scaridae',
    habitat: 'Marine waters of the UAE west coast', habitatCategory: 'Other',
    coast: 'Persian Gulf', regions: westCoast,
    description: 'Scarus persicus appears in the MOCCAE west-coast fishing calendar as Al Qain. It is distinct from the blue-barred parrotfish, Scarus ghobban, already in this guide. A shared local name alone is not enough to distinguish parrotfish species.',
    sources: [calendar],
  },
  {
    ...defaults, id: 'pickhandle-barracuda', slug: 'pickhandle-barracuda', name: 'Pickhandle Barracuda',
    localName: '', aliases: ['Pick-handle barracuda', 'Yellowtail barracuda'],
    scientificName: 'Sphyraena jello', family: 'Sphyraenidae',
    habitat: 'Reefs, bays, estuaries and lagoons', habitatCategory: 'Coastal',
    depth: '20–200 m', diet: 'Fish and squid', maxSizeCm: 150, maxWeightKg: 11.5,
    dangerLevel: 'potentially dangerous', coast: 'Persian Gulf', regions: ['Abu Dhabi'],
    description: 'Recorded in Abu Dhabi fisheries monitoring as a distinct species from the great barracuda. Dark bars cross the sides, and the tail is yellowish. Several barracuda species look similar; the published distribution is complicated by past misidentifications.',
    sources: [fisheries, { title: 'FishBase — Pickhandle barracuda', url: 'https://www.fishbase.se/summary/Sphyraena-jello.html' }],
  },
  {
    ...defaults, id: 'blackspot-snapper', slug: 'blackspot-snapper', name: 'Blackspot Snapper',
    localName: '', aliases: ['Black-spot snapper', "Ehrenberg’s snapper"],
    scientificName: 'Lutjanus ehrenbergii', family: 'Lutjanidae',
    habitat: 'Shallow reefs; juveniles in sandy, silty and mangrove-lined coastal areas', habitatCategory: 'Reef',
    depth: '1–20 m', maxSizeCm: 35,
    conservationStatus: 'Least Concern', conservationScope: 'UAE national assessment, 2019',
    coast: 'Both', regions: allCoasts,
    description: 'A small snapper recorded throughout UAE waters and in Abu Dhabi fisheries monitoring. It is a separate species from the one-spot snapper, Lutjanus monostigma. Juveniles use sheltered coastal habitats while adults inhabit reefs.',
    sources: [fisheries, { title: 'UAE National Red List — Lutjanus ehrenbergii (2019 assessment)', url: 'https://www.nationalredlist.org/node/51922' }],
  },
];
