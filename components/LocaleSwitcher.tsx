'use client';

import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { locales, type Locale, localeLabels, localeDirections } from '@/lib/i18n/config';

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export default function LocaleSwitcher() {
  const [current, setCurrent] = useState<Locale>('en');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    const saved = getCookie('NEXT_LOCALE') as Locale | null;
    const detected: Locale = saved && locales.includes(saved) ? saved : 'en';
    setCurrent(detected);
    html.lang = detected;
    html.dir = localeDirections[detected];
  }, []);

  function switchLocale(locale: Locale) {
    setCookie('NEXT_LOCALE', locale);
    setCurrent(locale);
    setOpen(false);
    document.documentElement.lang = locale;
    document.documentElement.dir = localeDirections[locale];
    window.location.reload();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Switch language"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Globe className="w-3.5 h-3.5" />
        <span>{localeLabels[current]}</span>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 mt-1 w-32 bg-[#0a0f1a] border border-white/10 rounded-md shadow-lg overflow-hidden z-50"
        >
          {locales.map((locale) => (
            <button
              key={locale}
              role="option"
              aria-selected={locale === current}
              onClick={() => switchLocale(locale)}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                locale === current
                  ? 'text-teal-400 bg-teal-500/10'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {localeLabels[locale]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
