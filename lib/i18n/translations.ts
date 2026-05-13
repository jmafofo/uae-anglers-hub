import type { Locale } from './config';

const translationCache: Partial<Record<Locale, Record<string, unknown>>> = {};

export async function getTranslations(locale: Locale): Promise<Record<string, unknown>> {
  if (translationCache[locale]) {
    return translationCache[locale]!;
  }

  const mod = await import(`@/locales/${locale}.json`);
  translationCache[locale] = mod.default;
  return mod.default;
}

export function t(translations: Record<string, unknown>, key: string): string {
  const parts = key.split('.');
  let current: unknown = translations;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return key; // fallback to key if translation missing
    }
  }

  return typeof current === 'string' ? current : key;
}
