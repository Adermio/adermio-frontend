// Adermio Service Worker v3.0.0
// Bump CACHE_VERSION whenever you ship code changes that must invalidate the
// old cache. The activate handler deletes any cache that does not match this
// version, forcing fresh network fetches on the next session.
//
// v3 changes:
//   - /vendor/ assets (self-hosted MediaPipe binaries) routed cache-first
//   - .wasm / .data / .binarypb / .tflite extensions treated as immutable
//   - Service Worker no longer points users at jsdelivr (we self-host)
const CACHE_VERSION = 'adermio-v3';
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

// Helper: long-lived static assets — safe to cache aggressively (cache-first).
// Also covers MediaPipe's WASM / data / model files which are versioned and
// never change for a given facescan.js release.
function isImmutableAsset(url) {
  const path = url.pathname.toLowerCase();
  if (path.startsWith('/vendor/')) return true;
  return path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg') ||
         path.endsWith('.gif') || path.endsWith('.webp') || path.endsWith('.svg') ||
         path.endsWith('.ico') || path.endsWith('.woff') || path.endsWith('.woff2') ||
         path.endsWith('.ttf') || path.endsWith('.otf') ||
         path.endsWith('.wasm') || path.endsWith('.data') ||
         path.endsWith('.binarypb') || path.endsWith('.tflite');
}

// Fetch routing:
//   HTML       → network-first (always try fresh, fall back to cache when offline)
//   JS / CSS   → stale-while-revalidate (instant from cache, refresh in background)
//   Img/Font   → cache-first (rarely change)
//   /vendor/   → cache-first (versioned, immutable)
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

  // Immutable assets (vendored MediaPipe, images, fonts): cache-first.
  // Checked BEFORE isCodeAsset because /vendor/*.js is also immutable
  // (versioned binary releases) and we don't want stale-while-revalidate
  // bombarding the network with revalidation requests for 6 MB WASM files.
  if (isImmutableAsset(url) || isCDN) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Code assets (JS / CSS at site root): stale-while-revalidate so a Vercel
  // deploy reaches returning users automatically.
  if (isCodeAsset(url)) {
    event.respondWith(
      caches.open(CACHE_VERSION).then((cache) => {
        return cache.match(request).then((cached) => {
          const networkFetch = fetch(request).then((response) => {
            if (response && response.ok) cache.put(request, response.clone());
            return response;
          }).catch(() => cached);
          return cached || networkFetch;
        });
      })
    );
    return;
  }

  // Anything else: passthrough
});
