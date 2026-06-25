export interface FishingSpot {
  id: string;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  emirate: string;
  accessType: string;
  species: string[];
  access: string;
  bestTime: string;
  facilities: string[];
  description?: string;
}

import spotPhotos from './spot-photos.json';
import localPhotos from './local-photos.json';

// Curated Unsplash photos mapped by access type — used as fallback only
const SPOT_IMAGES: Record<string, string> = {
  'Shore/Bridge':          'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=400&fit=crop&auto=format',
  'Shore/Boat':            'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&h=400&fit=crop&auto=format',
  'Shore/Kayak':           'https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=600&h=400&fit=crop&auto=format',
  'Shore':                 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop&auto=format',
  'Shore/Camping':         'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600&h=400&fit=crop&auto=format',
  'Shore/Breakwater':      'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&h=400&fit=crop&auto=format',
  'Shore/Marina':          'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&h=400&fit=crop&auto=format',
  'Shore/Port':            'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=600&h=400&fit=crop&auto=format',
  'Shore/Bay':             'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop&auto=format',
  'Shore/Historical':      'https://images.unsplash.com/photo-1548625149-720094d48f4b?w=600&h=400&fit=crop&auto=format',
  'Shore/Fishing Village': 'https://images.unsplash.com/photo-1572702273633-5f6b95a2b62b?w=600&h=400&fit=crop&auto=format',
  'Shore/Artificial Island':'https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=600&h=400&fit=crop&auto=format',
  'Shore/Boat Charter':    'https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=600&h=400&fit=crop&auto=format',
  'Freshwater':            'https://images.unsplash.com/photo-1500932334442-8761ee4810a7?w=600&h=400&fit=crop&auto=format',
  'Tidal Inlet':           'https://images.unsplash.com/photo-1559825481-12a05cc00344?w=600&h=400&fit=crop&auto=format',
  'Marina/Shore':          'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&h=400&fit=crop&auto=format',
  'Marina/Deep Sea':       'https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=600&h=400&fit=crop&auto=format',
  'Lagoon/Mangrove':       'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=600&h=400&fit=crop&auto=format',
  'Lagoon/Family':         'https://images.unsplash.com/photo-1527090526205-beaac8dc3c62?w=600&h=400&fit=crop&auto=format',
  'Mangrove/Flats':        'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=600&h=400&fit=crop&auto=format',
  'Deep Sea':              'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&h=400&fit=crop&auto=format',
  'Deep Sea/Offshore':     'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=600&h=400&fit=crop&auto=format',
};

const DEFAULT_SPOT_IMAGE = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop&auto=format';

/**
 * Priority order:
 * 1. Real photo from public/spot-photos/ (added by the owner)
 * 2. Google Places API photo (after running npm run fetch-photos)
 * 3. Curated Unsplash image matched by access type
 */
export function getSpotImage(slug: string, accessType: string): string {
  // 1. Local real photo
  const local = (localPhotos as Record<string, string[]>)[slug];
  if (local && local.length > 0) return local[0];

  // 2. Google Places photo reference
  const ref = (spotPhotos as Record<string, string>)[slug];
  if (ref) return `/api/spot-photo?ref=${encodeURIComponent(ref)}&w=600`;

  // 3. Unsplash fallback by access type
  if (SPOT_IMAGES[accessType]) return SPOT_IMAGES[accessType];
  const key = Object.keys(SPOT_IMAGES).find((k) =>
    accessType.toLowerCase().includes(k.toLowerCase().split('/')[0])
  );
  return key ? SPOT_IMAGES[key] : DEFAULT_SPOT_IMAGE;
}

/**
 * Returns all local photos for a spot (for gallery use on detail page).
 * Returns empty array if no local photos exist.
 */
export function getSpotGallery(slug: string): string[] {
  return (localPhotos as Record<string, string[]>)[slug] ?? [];
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function joinList(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function pickFrom<T>(items: T[], seed: string): T {
  return items[seed.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % items.length];
}

function decapitalize(text: string): string {
  if (!text) return text;
  return text[0].toLowerCase() + text.slice(1);
}

function cleanPhrase(text: string): string {
  return decapitalize(text.trim().replace(/[.!?]+$/, ''));
}

/**
 * Generates a natural, 150-250 word description for a fishing spot based on its
 * attributes. The output is deterministic for a given spot and varies sentence
 * structure to avoid a mad-lib feel.
 */
export function generateSpotDescription(spot: FishingSpot): string {
  const speciesList = joinList(spot.species.slice(0, 6));
  const facilitiesList = joinList(spot.facilities.slice(0, 4));
  const access = cleanPhrase(spot.access);
  const bestTime = cleanPhrase(spot.bestTime);
  const seed = spot.slug;

  const openings = [
    `${spot.name} is one of the more dependable fishing spots in ${spot.emirate}, offering anglers a mix of accessibility and variety.`,
    `Set along the ${spot.emirate} coastline, ${spot.name} is a practical choice for anglers who want straightforward access to productive water.`,
    `${spot.name} stands out as a solid ${spot.accessType.toLowerCase()} fishing option in ${spot.emirate}, with enough going for it to suit both short visits and longer sessions.`,
    `Anglers exploring ${spot.emirate} should keep ${spot.name} on their list, especially those looking for ${spot.accessType.toLowerCase()} fishing with decent facilities nearby.`,
  ];

  const accessStatements = [
    `Access is ${spot.accessType.toLowerCase()}: ${access}.`,
    `The spot is reached by ${spot.accessType.toLowerCase()} access, and ${access}.`,
    `Getting to the water is straightforward — ${access}, with ${spot.accessType.toLowerCase()} access.`,
    `You can fish here via ${spot.accessType.toLowerCase()} access; ${access}.`,
  ];

  const speciesStatements = [
    `Species commonly caught include ${speciesList}.`,
    `The water holds a mix of fish, including ${speciesList}.`,
    `Target ${speciesList} here, depending on season and tide.`,
    `Anglers regularly report ${speciesList}.`,
  ];

  const timeStatements = [
    `Timing matters: ${bestTime}.`,
    `Plan to fish ${bestTime} for the best results.`,
    `The most productive windows are usually ${bestTime}.`,
    `Local anglers tend to focus on ${bestTime}.`,
  ];

  const facilityStatements = [
    `Facilities include ${facilitiesList}.`,
    `You will find ${facilitiesList} available.`,
    `Useful amenities nearby include ${facilitiesList}.`,
    `The area provides ${facilitiesList}.`,
  ];

  const conditionsStatements = [
    'Wind direction and tide stage often matter more than time of day, so plan a flexible session if possible.',
    'Look for colour changes, rips, and bait activity on the surface, as these are reliable signs of where fish are feeding.',
    'Water clarity can change quickly here, so having both natural and bright lure colours on hand is sensible.',
    'A moving tide usually produces better than slack water, and early light is often the most productive part of the day.',
  ];

  const tackleStatements = [
    'A mixed box of lures, soft plastics, and bait rigs will cover most situations you are likely to encounter.',
    'Live bait, fresh cut bait, and a selection of jigs all have their place here depending on the target species.',
    'Start with a versatile setup and adjust leader strength once you see what size fish are active.',
    'Local bait shops can point you toward what is working, but carrying a few proven lure patterns is always wise.',
  ];

  const approachStatements = [
    'Arrive early to secure the best position, particularly on weekends when popular spots attract more anglers.',
    'Evening sessions can be surprisingly productive as predators move closer to shore to feed under lower light.',
    'Keep an eye out for local regulations, as some areas have seasonal closures or gear restrictions.',
    'Pairing up with a local angler or charter can shorten the learning curve and improve results on the first visit.',
  ];

  const observationStatements = [
    'Watch for birds working the surface, as they are a strong indicator of bait schools and feeding fish below.',
    'Subtle structure such as drop-offs, channels, and rocky outcrops often hold more fish than open sand.',
    'After a strong wind, water clarity can take a day or two to recover, so adjust your expectations accordingly.',
    'A quiet approach and minimal noise on the rocks or deck will keep fish from spooking in shallow water.',
  ];

  const accessTypeNotes: Record<string, string> = {
    'Shore/Bridge': 'Bridge fishing works best when you can cast into deeper channels or around structure below.',
    'Shore/Boat': 'You can fish from the shore or arrange a boat to reach better structure further out.',
    'Shore/Kayak': 'A kayak opens up more water, but shore casting is still productive from accessible points.',
    'Shore': 'This is a straightforward shore spot where covering ground and reading the tide will improve your results.',
    'Shore/Camping': 'Many anglers camp overnight, making this a good choice for extended sessions under the stars.',
    'Shore/Breakwater': 'The breakwater creates current breaks and structure that hold fish at different stages of the tide.',
    'Shore/Marina': 'Marina walls and nearby jetties often hold fish, especially after dark when lights attract bait.',
    'Shore/Port': 'Port areas can be productive but require awareness of vessel traffic and any access restrictions.',
    'Shore/Bay': 'Bays offer protection from wind and swell, making this a reliable option when the open coast is rough.',
    'Shore/Historical': 'The surrounding area has historical character, and the fishing has supported local communities for generations.',
    'Shore/Fishing Village': 'The local fishing community is a useful source of recent reports and the best bait options.',
    'Shore/Artificial Island': 'The artificial structure creates habitat and current edges that can hold fish consistently.',
    'Shore/Boat Charter': 'Charter boats can take you to reefs and wrecks that are hard to reach from shore.',
    'Freshwater': 'Freshwater tactics work well here, with bait and light lures both producing results.',
    'Tidal Inlet': 'Tidal inlets concentrate bait and predator fish, so timing your visit with tide movement is key.',
    'Marina/Shore': 'Marina walls and nearby jetties often hold fish, especially after dark when lights attract bait.',
    'Marina/Deep Sea': 'Most serious fishing here is done by charter, with captains knowing the local reefs and offshore grounds.',
    'Lagoon/Mangrove': 'Mangrove roots and channels provide shelter for juvenile fish, which in turn attract larger predators.',
    'Lagoon/Family': 'This is a beginner-friendly area where families can fish safely close to amenities.',
    'Mangrove/Flats': 'Flats fishing demands stealth and a good eye for moving fish, especially on calm mornings.',
    'Deep Sea': 'Deep sea fishing here typically requires a boat and local knowledge of seasonal fish movements.',
    'Deep Sea/Offshore': 'Offshore trips target bigger pelagic species, and conditions can change quickly away from land.',
  };

  const emirateNotes: Record<string, string> = {
    'Dubai': `Dubai's coastline is heavily developed, so accessible public spots like this one are worth using.`,
    'Abu Dhabi': `Abu Dhabi's shoreline includes some of the UAE's quieter beaches and islands, which helps keep fishing pressure lower in places like this.`,
    'Sharjah': `Sharjah's coast tends to see less pressure than Dubai's, which can improve your chances on the right day.`,
    'Ajman': `Ajman's compact coastline punches above its weight for accessible shore and mangrove fishing.`,
    'Umm Al Quwain': `UAQ's more relaxed coastline is a good alternative when busier emirates are crowded.`,
    'Ras Al Khaimah': `RAK offers a blend of shore, reef, and offshore options, and this spot fits well into a coastal fishing plan.`,
    'Fujairah': `Fujairah's east coast location on the Gulf of Oman brings different currents and species compared with the Arabian Gulf side.`,
  };

  const closingTips = [
    'Bring a range of lure sizes and check local tide charts before you go.',
    'It is worth scouting the area at low tide to identify channels and structure before fishing the incoming water.',
    'Respect any posted rules, keep the area clean, and be prepared to move if the bite is slow.',
    'A medium-heavy spinning setup covers most situations here, and live bait often outperforms lures at dawn.',
  ];

  const sentences = [
    pickFrom(openings, seed),
    pickFrom(accessStatements, seed),
    accessTypeNotes[spot.accessType] ?? pickFrom(accessStatements, seed),
    pickFrom(speciesStatements, seed),
    pickFrom(timeStatements, seed),
    pickFrom(facilityStatements, seed),
    pickFrom(conditionsStatements, seed),
    pickFrom(tackleStatements, seed),
    pickFrom(approachStatements, seed),
    pickFrom(observationStatements, seed),
    emirateNotes[spot.emirate] ?? '',
    pickFrom(closingTips, seed),
  ].filter(Boolean);

  return sentences.join(' ');
}

const rawSpots = [
  { name: 'Al Garhoud Bridge', latitude: 25.2524, longitude: 55.3425, emirate: 'Dubai', accessType: 'Shore/Bridge', species: 'Barracuda, Milkfish, Tilapia, Striped Bass, Grouper, Sea Bream', access: 'Public - Under bridge', bestTime: 'Early morning, late evening', facilities: 'Parking, nearby restaurants' },
  { name: 'Al Maktoum Bridge', latitude: 25.266, longitude: 55.314, emirate: 'Dubai', accessType: 'Shore/Bridge', species: 'Catfish, Carp, Barracuda, Grouper', access: 'Public - Dedicated pier', bestTime: 'Early morning, late evening', facilities: 'Parking, dedicated fishing pier' },
  { name: 'Dubai Creek', latitude: 25.2631, longitude: 55.3289, emirate: 'Dubai', accessType: 'Shore/Boat', species: 'Barracuda, Bream, Sherri', access: 'Public', bestTime: 'Early morning, late afternoon, high tide', facilities: 'Multiple access points, boat rentals' },
  { name: 'Jumeirah Beach', latitude: 25.2048, longitude: 55.2708, emirate: 'Dubai', accessType: 'Shore/Kayak', species: 'Kingfish, Queenfish, Hammour, Barracuda, Sultan Ibrahim, Trevally', access: 'Public beach', bestTime: 'All day', facilities: 'Beach facilities, restaurants, water sports' },
  { name: 'The Palm Jumeirah', latitude: 25.1124, longitude: 55.139, emirate: 'Dubai', accessType: 'Shore/Boat', species: 'Snapper, Grouper, Trevally', access: 'Various points', bestTime: 'Night fishing recommended', facilities: 'Multiple access points' },
  { name: 'Jebel Ali Beach', latitude: 25.0157, longitude: 55.0207, emirate: 'Dubai', accessType: 'Shore', species: 'Kingfish, Barracuda, Snappers', access: 'Public', bestTime: 'All day, good for camping', facilities: 'Camping allowed, water sports' },
  { name: 'Dubai Marina', latitude: 25.0804, longitude: 55.1398, emirate: 'Dubai', accessType: 'Shore/Boat', species: 'Small fish, Barracuda', access: 'Public walkways', bestTime: 'Evening', facilities: 'Restaurants, yacht charters' },
  { name: 'Safa Park Lake', latitude: 25.1893, longitude: 55.2572, emirate: 'Dubai', accessType: 'Freshwater', species: 'Tilapia, Carp, Catfish, Bream', access: 'Public park (entry fee AED 4)', bestTime: 'All day', facilities: 'Park amenities, boat rentals' },
  { name: 'Al Seef District', latitude: 25.264, longitude: 55.297, emirate: 'Dubai', accessType: 'Shore/Marina', species: 'Tilapia, Kingfish, Sea Bass', access: 'Marina berths', bestTime: 'All day', facilities: 'Marina facilities, restaurants, heritage area' },
  { name: 'Umm Suqeim Beach', latitude: 25.1426, longitude: 55.1876, emirate: 'Dubai', accessType: 'Shore', species: 'Various species', access: 'Public', bestTime: 'Various', facilities: 'Beach amenities' },
  { name: 'Al Aryam Island', latitude: 24.3068, longitude: 54.2266, emirate: 'Abu Dhabi', accessType: 'Shore/Camping', species: 'Small fish, Hamour, Poison fish, Puffer fish', access: 'Public - Good for camping', bestTime: 'Overnight/daytime', facilities: 'Camping area, good for families' },
  { name: 'Mina Breakwater', latitude: 24.5, longitude: 54.37, emirate: 'Abu Dhabi', accessType: 'Shore/Breakwater', species: 'Small fish', access: 'Public', bestTime: '10AM onwards', facilities: 'Breakwater access' },
  { name: 'Marina Mall Island', latitude: 24.4764, longitude: 54.3219, emirate: 'Abu Dhabi', accessType: 'Shore', species: 'Shari (Ray fish)', access: 'Public', bestTime: 'All day', facilities: 'Mall nearby' },
  { name: 'Salam Corniche', latitude: 24.49, longitude: 54.36, emirate: 'Abu Dhabi', accessType: 'Shore', species: 'Mixed catches', access: 'Public - No tents allowed', bestTime: 'Day fishing', facilities: 'Corniche facilities' },
  { name: 'Mussafah Bridge', latitude: 24.36, longitude: 54.51, emirate: 'Abu Dhabi', accessType: 'Shore', species: 'Various', access: 'Check for restrictions', bestTime: 'Various', facilities: 'Limited' },
  { name: 'Al Bateen', latitude: 24.46, longitude: 54.32, emirate: 'Abu Dhabi', accessType: 'Shore/Beach', species: 'Various', access: 'Public', bestTime: 'Evening', facilities: 'Beach area' },
  { name: 'Mina Zayed', latitude: 24.52, longitude: 54.39, emirate: 'Abu Dhabi', accessType: 'Shore/Port', species: 'Various', access: 'Port area', bestTime: 'Various', facilities: 'Port facilities, fish market' },
  { name: 'Al Khan Lagoon', latitude: 25.3211, longitude: 55.3831, emirate: 'Sharjah', accessType: 'Shore/Lagoon', species: 'Kingfish, Queenfish, Trevally, Cobia', access: 'Public - Very accessible', bestTime: 'All day', facilities: 'Natural surroundings' },
  { name: 'Al Hamriyah Port', latitude: 25.42, longitude: 55.51, emirate: 'Sharjah', accessType: 'Shore/Boat', species: 'Groupers, Kingfish, Snapper', access: 'Public', bestTime: 'All day', facilities: 'Port access, boat launches' },
  { name: 'Khor Kalba', latitude: 25.055, longitude: 56.355, emirate: 'Sharjah', accessType: 'Tidal Inlet', species: 'Snapper, Barracuda, Catfish', access: 'Public - Check tide charts', bestTime: 'Incoming tide', facilities: 'Mangrove area' },
  { name: 'Marbella Resort Area', latitude: 25.29, longitude: 55.3, emirate: 'Sharjah', accessType: 'Shore/Boat Charter', species: 'Kingfish, Deep sea species', access: 'Charter boats available', bestTime: 'September to April', facilities: 'Charter services, resort facilities' },
  { name: 'Sharjah Corniche', latitude: 25.35, longitude: 55.39, emirate: 'Sharjah', accessType: 'Shore', species: 'Various', access: 'Public', bestTime: 'Evening', facilities: 'Corniche walkway' },
  { name: 'Ajman Marina', latitude: 25.405, longitude: 55.435, emirate: 'Ajman', accessType: 'Marina/Shore', species: 'Various', access: 'Public - Luxury waterfront', bestTime: 'All day', facilities: 'Yacht club, dining, recreational activities' },
  { name: 'Ajman Corniche', latitude: 25.41, longitude: 55.44, emirate: 'Ajman', accessType: 'Shore', species: 'Small to medium fish', access: 'Public', bestTime: 'Various', facilities: 'Corniche facilities' },
  { name: 'Ajman Beach', latitude: 25.405, longitude: 55.445, emirate: 'Ajman', accessType: 'Shore', species: 'Various coastal species', access: 'Public', bestTime: 'Early morning, evening', facilities: 'Beach access' },
  { name: 'UAQ Coastline', latitude: 25.5644, longitude: 55.555, emirate: 'Umm Al Quwain', accessType: 'Shore', species: 'Good variety', access: 'Public - No ban', bestTime: 'All day', facilities: 'Multiple access points' },
  { name: 'UAQ Lagoons', latitude: 25.55, longitude: 55.53, emirate: 'Umm Al Quwain', accessType: 'Lagoon/Mangrove', species: 'Various', access: 'Public', bestTime: 'Various', facilities: 'Natural areas' },
  { name: 'Al Hamra Marina', latitude: 25.68, longitude: 55.77, emirate: 'Ras Al Khaimah', accessType: 'Marina/Deep Sea', species: 'Kingfish, Barracuda, Snapper, Cobia, Amberjack, Sailfish, Yellowfin Tuna', access: 'Charter boats', bestTime: 'All year (peak: winter)', facilities: 'Professional charters, safety equipment' },
  { name: 'Al Marjan Island', latitude: 25.685, longitude: 55.795, emirate: 'Ras Al Khaimah', accessType: 'Shore/Artificial Island', species: 'Various reef species', access: 'Public', bestTime: 'Night fishing excellent', facilities: 'Hotels, beaches, turquoise waters' },
  { name: 'Al Jazeera Al Hamra Beach', latitude: 25.695, longitude: 55.815, emirate: 'Ras Al Khaimah', accessType: 'Shore/Historical', species: 'Grouper, Trevally, Queenfish, Snapper, Cobia', access: 'Public - Historic fishing village', bestTime: 'All day', facilities: 'Shallow waters, nearby reefs' },
  { name: 'Al Rams Beach', latitude: 25.86, longitude: 56.04, emirate: 'Ras Al Khaimah', accessType: 'Shore', species: 'Various', access: 'Public', bestTime: 'Night fishing popular', facilities: 'Peaceful location' },
  { name: 'Mina Al Arab Lagoon', latitude: 25.67, longitude: 55.76, emirate: 'Ras Al Khaimah', accessType: 'Lagoon/Family', species: 'Rabbitfish, Small Barracuda, Emperor Fish', access: 'Public - Beginner friendly', bestTime: 'All day', facilities: 'Safe waters, mangroves' },
  { name: 'Dhayah Bay', latitude: 25.75, longitude: 55.9, emirate: 'Ras Al Khaimah', accessType: 'Deep Sea', species: 'Deep sea species', access: 'Charter boats', bestTime: 'Various', facilities: 'Deep sea access' },
  { name: 'Khor Al Beidah', latitude: 25.7, longitude: 55.85, emirate: 'Ras Al Khaimah', accessType: 'Mangrove/Flats', species: 'Trevally, Mullet, Small Reef Fish', access: 'Public', bestTime: 'Various', facilities: 'Mangroves, shallow flats' },
  { name: 'RAK Offshore', latitude: 25.8, longitude: 56.2, emirate: 'Ras Al Khaimah', accessType: 'Deep Sea/Offshore', species: 'Sailfish, Tuna, Dorado, Giant Trevally, Sharks', access: 'Full-day charters only', bestTime: 'All year', facilities: 'Big-game fishing' },
  { name: 'Flamingo Beach', latitude: 25.65, longitude: 55.73, emirate: 'Ras Al Khaimah', accessType: 'Shore', species: 'Various coastal species', access: 'Public', bestTime: 'Various', facilities: 'Beach access' },
  { name: 'Fujairah Marine Club', latitude: 25.115, longitude: 56.3456, emirate: 'Fujairah', accessType: 'Marina/Deep Sea', species: 'Dorado, Sailfish, Amberjack, Yellowfin Tuna, Trevally, Striped Marlin', access: 'Charter boats', bestTime: 'October to March', facilities: 'Full charter services' },
  { name: 'Fujairah Port Area', latitude: 25.125, longitude: 56.355, emirate: 'Fujairah', accessType: 'Shore/Port', species: 'Various', access: 'Public areas', bestTime: 'Various', facilities: 'Port access' },
  { name: 'Dibba', latitude: 25.62, longitude: 56.27, emirate: 'Fujairah', accessType: 'Shore/Fishing Village', species: 'Various', access: 'Public - Major fishing hub', bestTime: 'Early morning (market opens 5 AM)', facilities: 'Live fish auctions, fishing village' },
  { name: 'Khor Fakkan', latitude: 25.335, longitude: 56.342, emirate: 'Fujairah', accessType: 'Shore/Bay', species: 'Various Gulf of Oman species', access: 'Public', bestTime: 'Various', facilities: 'Bay area, scenic location' },
  { name: 'Fujairah Beaches', latitude: 25.12, longitude: 56.325, emirate: 'Fujairah', accessType: 'Shore', species: 'Various', access: 'Multiple public beaches', bestTime: 'Various', facilities: 'Beach access along coast' },

  // Community additions
  { name: 'Hameem Beach', latitude: 24.240377, longitude: 54.306735, emirate: 'Abu Dhabi', accessType: 'Shore/Camping', species: 'Hammour, Kingfish, Barracuda, Emperor Fish, Trevally, Spangled Emperor, Queen Fish, Cobia, Grouper, Bream', access: 'Public - Remote pristine beach on the Abu Dhabi coast. No restrictions. Camping permitted overnight.', bestTime: 'Early morning, evening, and overnight — one of the best night fishing beaches in Abu Dhabi', facilities: 'Camping allowed, fire pits, crystal clear shallow water, pristine unspoiled shoreline, very low fishing pressure' },
  { name: 'Mangrove Village', latitude: 24.435, longitude: 54.442, emirate: 'Abu Dhabi', accessType: 'Mangrove/Flats', species: 'Mullet, Trevally, Barracuda, Grouper, Sea Bass', access: 'Public - Kayak and paddleboard launch area', bestTime: 'Early morning, incoming tide', facilities: 'Kayak rentals nearby, mangrove boardwalks, sheltered water' },
  { name: 'Al Mamzah Beach', latitude: 25.326, longitude: 55.407, emirate: 'Dubai', accessType: 'Shore', species: 'Kingfish, Queenfish, Trevally, Barracuda, Bream, Sultan Ibrahim', access: 'Public beach park (small entry fee)', bestTime: 'Early morning, evening, good year-round', facilities: 'Beach park, parking, showers, nearby cafes, calm sheltered water' },
  { name: 'Al Zorah Nature Reserve', latitude: 25.422, longitude: 55.472, emirate: 'Ajman', accessType: 'Mangrove/Flats', species: 'Mullet, Trevally, Barracuda, Grouper, Sea Bass, Rabbitfish', access: 'Public - Kayak rentals available at reserve entrance', bestTime: 'Early morning, high tide for best results', facilities: 'Kayak rental, nature trails, flamingo colony, mangrove boardwalk' },
];

export const fishingSpots: FishingSpot[] = rawSpots.map((s, i) => {
  const species = s.species.split(',').map((sp) => sp.trim());
  const facilities = s.facilities.split(',').map((f) => f.trim());
  const spot: FishingSpot = {
    id: String(i + 1),
    name: s.name,
    slug: slugify(s.name),
    latitude: s.latitude,
    longitude: s.longitude,
    emirate: s.emirate,
    accessType: s.accessType,
    species,
    access: s.access,
    bestTime: s.bestTime,
    facilities,
  };
  return { ...spot, description: generateSpotDescription(spot) };
});

export const emirates = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'];

export function getSpotBySlug(slug: string): FishingSpot | undefined {
  return fishingSpots.find((s) => s.slug === slug);
}

export function getSpotsByEmirate(emirate: string): FishingSpot[] {
  return fishingSpots.filter((s) => s.emirate === emirate);
}
