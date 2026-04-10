import type { MetadataRoute } from 'next';
import { fishingSpots } from '@/lib/spots';
import { fishSpecies } from '@/lib/species';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://uaeangler.com';

  const staticPages: MetadataRoute.Sitemap = [
    // Core
    { url: base,                              lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${base}/spots`,                   lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${base}/species`,                 lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${base}/weather`,                 lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.8 },
    { url: `${base}/regulations`,             lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/charters`,                lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    // Community hub + sub-pages
    { url: `${base}/community`,               lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${base}/community/feed`,          lastModified: new Date(), changeFrequency: 'daily',   priority: 0.7 },
    { url: `${base}/catches`,                 lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${base}/forum`,                   lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${base}/tournaments`,             lastModified: new Date(), changeFrequency: 'daily',   priority: 0.7 },
    { url: `${base}/shop`,                    lastModified: new Date(), changeFrequency: 'daily',   priority: 0.7 },
    { url: `${base}/advertise`,               lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/assistant`,               lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    // Science & conservation
    { url: `${base}/conservation`,            lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/research`,                lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/research/biogenome`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/ocean-sentinel`,          lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    // Auth excluded (login/signup) — private pages not useful to index
    // community/messages excluded — requires auth
  ];

  // Priority spots get 0.95 — known community favourites with real photos
  const prioritySpotSlugs = new Set(['hameem-beach', 'al-hamra-marina', 'fujairah-marine-club', 'khor-fakkan', 'dibba', 'al-zorah-nature-reserve', 'al-mamzah-beach']);

  const spotPages: MetadataRoute.Sitemap = fishingSpots.map((spot) => ({
    url: `${base}/spots/${spot.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: prioritySpotSlugs.has(spot.slug) ? 0.95 : 0.8,
  }));

  const speciesPages: MetadataRoute.Sitemap = fishSpecies.map((species) => ({
    url: `${base}/species/${species.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.75,
  }));

  return [...staticPages, ...spotPages, ...speciesPages];
}
