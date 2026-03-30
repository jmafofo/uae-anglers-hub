import type { MetadataRoute } from 'next';
import { fishingSpots } from '@/lib/spots';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://uaeangler.com';

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/spots`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/signup`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];

  const spotPages: MetadataRoute.Sitemap = fishingSpots.map((spot) => ({
    url: `${base}/spots/${spot.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  return [...staticPages, ...spotPages];
}
