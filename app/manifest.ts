import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'UAEAngler',
    short_name: 'UAEAngler',
    description: 'Fishing spots, catches, species ID, live chat and trip planning for anglers across all seven Emirates.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f7f9fa',
    theme_color: '#23675e',
    categories: ['sports', 'lifestyle', 'navigation'],
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
