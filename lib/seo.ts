import type { Metadata } from 'next';

export const SITE_URL = 'https://uaeangler.com';
export const SITE_NAME = 'UAEAngler';
export const SOCIAL_IMAGE = `${SITE_URL}/social/uaeangler-fishing-day-v2.png`;
export const SOCIAL_TITLE = 'UAEAngler — Your next great fishing day';
export const SOCIAL_DESCRIPTION = 'Find UAE fishing spots, explore tackle and charters, and share your next great catch.';
export const SITE_DESCRIPTION = 'Explore UAE fishing spots, identify local fish species, browse tackle and pre-owned gear, and discover fishing charters and the angling community.';

export function publicMetadata(path: string, title: string, description: string, image?: string): Metadata {
  const url = new URL(path, SITE_URL).href;
  const images = image ? [{ url: image, alt: title }] : [{ url: `${SITE_URL}/api/og?v=2&title=${encodeURIComponent(title)}`, width: 1200, height: 630, alt: title }];
  return { title, description, alternates: { canonical: url },
    openGraph: { type: 'website', siteName: SITE_NAME, locale: 'en_AE', url, title, description, images },
    twitter: { card: 'summary_large_image', title, description, images: images.map(i => i.url) },
  };
}
export const jsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');
export function breadcrumbs(items: { name: string; path: string }[]) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((item, i) => ({
    '@type': 'ListItem', position: i + 1, name: item.name, item: new URL(item.path, SITE_URL).href,
  })) };
}
export function productSchema(item: { id: string; title: string; description?: string | null; photos?: string[] | null; price?: number | string | null; condition?: string | null; is_sold?: boolean; stock_quantity?: number | null }) {
  const price = Number(item.price);
  return { '@context': 'https://schema.org', '@type': 'Product', name: item.title, description: item.description || undefined,
    url: `${SITE_URL}/shop/${encodeURIComponent(item.id)}`, image: item.photos?.length ? item.photos : undefined,
    offers: item.price != null && Number.isFinite(price) && price > 0 ? {
      '@type': 'Offer', url: `${SITE_URL}/shop/${encodeURIComponent(item.id)}`, priceCurrency: 'AED', price,
      availability: item.is_sold ? 'https://schema.org/SoldOut' : item.stock_quantity === 0 ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      itemCondition: item.condition === 'new' ? 'https://schema.org/NewCondition' : item.condition ? 'https://schema.org/UsedCondition' : undefined,
    } : undefined,
  };
}
