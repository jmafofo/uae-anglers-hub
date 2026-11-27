import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { fishingSpots, emirates } from '@/lib/spots';
import { fishSpecies } from '@/lib/species';
import { SITE_URL } from '@/lib/seo';

export const revalidate = 3600;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = ['', '/about', '/contact', '/spots', '/species', '/weather', '/regulations',
    '/beginners-guide', '/charters', '/shop', '/community', '/advertise', '/assistant',
    '/conservation', '/research', '/research/biogenome', '/ocean-sentinel',
    '/privacy-policy', '/terms-of-service', '/editorial-policy', '/species/photo-credits'];
  const entries: MetadataRoute.Sitemap = [
    ...paths.map(path => ({ url: SITE_URL + path })),
    ...emirates.map(name => ({ url: SITE_URL + '/fishing/' + name.toLowerCase().replaceAll(' ', '-') })),
    ...fishingSpots.map(spot => ({ url: SITE_URL + '/spots/' + spot.slug })),
    ...fishSpecies.map(species => ({ url: SITE_URL + '/species/' + species.slug })),
  ];
  // Omit lastModified unless a genuine content-update date is available.
  // Anonymous reads obey the same RLS as public detail pages.
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  for (const table of ['charters', 'listings'] as const) {
    for (let offset = 0; ; offset += 1000) {
      let query = db.from(table).select(table === 'charters' ? 'slug' : 'id').order(table === 'charters' ? 'slug' : 'id');
      if (table === 'listings') query = query.eq('is_active', true).eq('is_sold', false);
      const { data, error } = await query.range(offset, offset + 999);
      if (error) throw new Error('Sitemap public ' + table + ' query failed: ' + error.code);
      for (const row of data ?? []) {
        const record = row as unknown as { id?: string; slug?: string };
        const key = table === 'charters' ? record.slug : record.id;
        if (key) entries.push({ url: SITE_URL + '/' + (table === 'charters' ? 'charters' : 'shop') + '/' + encodeURIComponent(key) });
      }
      if (entries.length >= 49000) throw new Error('Split sitemap before reaching 50,000 URLs');
      if (!data || data.length < 1000) break;
    }
  }
  return entries;
}
