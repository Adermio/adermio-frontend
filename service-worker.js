// Adermio Service Worker v2.0.0
// Bump CACHE_VERSION whenever you ship code changes that must invalidate the old
// cache. The activate handler deletes any cache that does not match this version,
// forcing fresh network fetches on the next session.
const CACHE_VERSION = 'adermio-v2';
const OFFLINE_URL = '/offline.html';

// Static assets to pre-cache on install
const PRECACHE_ASSETS = [
  OFFLINE_URL,
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
  '/logo_Adermio.png'
];

// Install: pre-cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Helper: identify static asset paths whose content can change between deploys
// (JS, CSS) — these need stale-while-revalidate so users pick up updates without
// manually clearing the cache.
function isCodeAsset(url) {
  const path = url.pathname.toLowerCase();
  return path.endsWith('.js') || path.endsWith('.css') || path.endsWith('.mjs');
}

// Helper: long-lived static assets (images, fonts) — safe to cache aggressively
function isImmutableAsset(url) {
  const path = url.pathname.toLowerCase();
  return path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg') ||
         path.endsWith('.gif') || path.endsWith('.webp') || path.endsWith('.svg') ||
         path.endsWith('.ico') || path.endsWith('.woff') || path.endsWith('.woff2') ||
         path.endsWith('.ttf') || path.endsWith('.otf');
}

// Fetch routing:
//   HTML       → network-first (always try fresh, fall back to cache when offline)
//   JS / CSS   → stale-while-revalidate (instant from cache, refresh in background)
//   Img/Font   → cache-first (rarely change)
//   Other      → passthrough
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isCDN = url.hostname.includes('cdn.tailwindcss.com') ||
                url.hostname.includes('cdn.jsdelivr.net') ||
                url.hostname.includes('unpkg.com') ||
                url.hostname.includes('fonts.googleapis.com') ||
                url.hostname.includes('fonts.gstatic.com');

  if (!isSameOrigin && !isCDN) return;

  // HTML pages: network-first
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // Code assets (JS / CSS): stale-while-revalidate so a Vercel deploy reaches
  // returning users automatically. They get cached version this load, fresh on next.
  if (isCodeAsset(url)) {
    event.respondWith(
      caches.open(CACHE_VERSION).then((cache) => {
        return cache.match(request).then((cached) => {
          const networkFetch = fetch(request).then((response) => {
            if (response && response.ok) cache.put(request, response.clone());
            return response;
          }).catch(() => cached);
          // Return cached immediately if available; otherwise wait for network.
          return cached || networkFetch;
        });
      })
    );
    return;
  }

  // Immutable assets (images, fonts): cache-first
  if (isImmutableAsset(url) || isCDN) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Anything else: passthrough (let the browser handle it)
});
