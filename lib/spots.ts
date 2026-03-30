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
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
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
];

export const fishingSpots: FishingSpot[] = rawSpots.map((s, i) => ({
  id: String(i + 1),
  name: s.name,
  slug: slugify(s.name),
  latitude: s.latitude,
  longitude: s.longitude,
  emirate: s.emirate,
  accessType: s.accessType,
  species: s.species.split(',').map((sp) => sp.trim()),
  access: s.access,
  bestTime: s.bestTime,
  facilities: s.facilities.split(',').map((f) => f.trim()),
}));

export const emirates = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'];

export function getSpotBySlug(slug: string): FishingSpot | undefined {
  return fishingSpots.find((s) => s.slug === slug);
}

export function getSpotsByEmirate(emirate: string): FishingSpot[] {
  return fishingSpots.filter((s) => s.emirate === emirate);
}
