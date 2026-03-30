export interface Emirate {
  name: string;
  latitude: number;
  longitude: number;
  slug: string;
}

export const EMIRATES: Emirate[] = [
  { name: 'Dubai', latitude: 25.2048, longitude: 55.2708, slug: 'dubai' },
  { name: 'Abu Dhabi', latitude: 24.4539, longitude: 54.3773, slug: 'abu-dhabi' },
  { name: 'Sharjah', latitude: 25.3573, longitude: 55.4033, slug: 'sharjah' },
  { name: 'Ajman', latitude: 25.4052, longitude: 55.5136, slug: 'ajman' },
  { name: 'Umm Al Quwain', latitude: 25.5644, longitude: 55.5553, slug: 'umm-al-quwain' },
  { name: 'Ras Al Khaimah', latitude: 25.7895, longitude: 55.9432, slug: 'ras-al-khaimah' },
  { name: 'Fujairah', latitude: 25.1288, longitude: 56.3265, slug: 'fujairah' },
];

export function getEmirateBySlug(slug: string): Emirate | undefined {
  return EMIRATES.find((e) => e.slug === slug);
}

// WMO weather code → label + emoji
export function describeWeatherCode(code: number): { label: string; emoji: string } {
  if (code === 0) return { label: 'Clear sky', emoji: '☀️' };
  if (code <= 2) return { label: 'Partly cloudy', emoji: '⛅' };
  if (code === 3) return { label: 'Overcast', emoji: '☁️' };
  if (code <= 49) return { label: 'Foggy', emoji: '🌫️' };
  if (code <= 59) return { label: 'Drizzle', emoji: '🌦️' };
  if (code <= 69) return { label: 'Rain', emoji: '🌧️' };
  if (code <= 79) return { label: 'Snow', emoji: '❄️' };
  if (code <= 84) return { label: 'Rain showers', emoji: '🌦️' };
  if (code <= 99) return { label: 'Thunderstorm', emoji: '⛈️' };
  return { label: 'Unknown', emoji: '🌡️' };
}

// Wind direction in degrees → compass label
export function windDirection(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

// Calculate fishing score 0–100
export function calcFishingScore({
  weatherCode,
  windSpeed,
  waveHeight,
  humidity,
}: {
  weatherCode: number;
  windSpeed: number;
  waveHeight: number;
  humidity: number;
}): number {
  let score = 100;
  // Weather penalty
  if (weatherCode >= 80) score -= 40;
  else if (weatherCode >= 60) score -= 25;
  else if (weatherCode >= 45) score -= 15;
  else if (weatherCode >= 3) score -= 5;
  // Wind penalty (km/h)
  if (windSpeed > 40) score -= 35;
  else if (windSpeed > 25) score -= 20;
  else if (windSpeed > 15) score -= 10;
  // Wave height penalty (m)
  if (waveHeight > 2) score -= 25;
  else if (waveHeight > 1) score -= 10;
  else if (waveHeight > 0.5) score -= 5;
  // Humidity — slight bonus if moderate
  if (humidity >= 40 && humidity <= 70) score += 5;
  return Math.max(0, Math.min(100, score));
}

export function scoreLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Excellent', color: 'text-teal-400' };
  if (score >= 60) return { label: 'Good', color: 'text-green-400' };
  if (score >= 40) return { label: 'Fair', color: 'text-yellow-400' };
  return { label: 'Poor', color: 'text-red-400' };
}
