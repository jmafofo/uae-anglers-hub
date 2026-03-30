import type { MetadataRoute } from 'next';
import { fishingSpots } from '@/lib/spots';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://uaeangler.com';

  const staticPages: MetadataRoute.Sitemap = [
    // Core
    { url: base,                        lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${base}/spots`,             lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${base}/weather`,           lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.8 },
    // Community
    { url: `${base}/catches`,           lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${base}/forum`,             lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${base}/tournaments`,       lastModified: new Date(), changeFrequency: 'daily',   priority: 0.7 },
    { url: `${base}/shop`,              lastModified: new Date(), changeFrequency: 'daily',   priority: 0.7 },
    { url: `${base}/assistant`,         lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    // Auth excluded (login/signup) — private/auth pages not useful to index
  ];

  // Priority spots get 0.95 — known community favourites with real photos
  const prioritySpotSlugs = new Set(['hameem-beach', 'al-hamra-marina', 'fujairah-marine-club', 'khor-fakkan', 'dibba', 'al-zorah-nature-reserve', 'al-mamzah-beach']);

  const spotPages: MetadataRoute.Sitemap = fishingSpots.map((spot) => ({
    url: `${base}/spots/${spot.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: prioritySpotSlugs.has(spot.slug) ? 0.95 : 0.8,
  }));

  return [...staticPages, ...spotPages];
}
