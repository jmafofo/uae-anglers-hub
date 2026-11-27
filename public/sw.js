/* UAE Anglers Hub service worker — network-first for pages/APIs,
   cache-first for static assets (photos, videos, tiles). */
const VERSION = 'uaeangler-v1';
const STATIC_CACHE = `${VERSION}-static`;

const STATIC_EXTENSIONS = /\.(?:png|jpe?g|webp|gif|svg|mp4|webm|woff2?|css|js)(\?|$)/;
const NEVER_CACHE = /supabase\.co|exp\.host|api\.open-meteo\.com|google|stripe|\/api\//;

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = request.url;

  // Static assets: cache-first, then network (and store).
  if (STATIC_EXTENSIONS.test(url) && !NEVER_CACHE.test(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      }),
    );
    return;
  }

  // Everything else (pages, APIs): network-first with cache fallback.
  if (NEVER_CACHE.test(url)) return; // let the browser handle it live
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && request.mode === 'navigate') {
          const copy = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request)),
  );
});
