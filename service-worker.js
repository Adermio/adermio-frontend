// Adermio Service Worker v3.1.0
// Bump CACHE_VERSION whenever you ship code changes that must invalidate the
// old cache. The activate handler deletes any cache that does not match this
// version, forcing fresh network fetches on the next session.
//
// v3 changes:
//   - /vendor/ assets (self-hosted MediaPipe binaries) routed cache-first
//   - .wasm / .data / .binarypb / .tflite extensions treated as immutable
//   - Service Worker no longer points users at jsdelivr (we self-host)
// v3.1 hardening:
//   - Precache uses Promise.allSettled so a single 404 doesn't brick install
//   - Captive-portal protection: cache-first paths reject if the response
//     content-type isn't what was requested (HTML masquerading as .wasm)
//   - HTML responses cached only when status is 200 + same-origin (no error
//     pages, no opaque redirects polluting the offline fallback)
//
// IMPORTANT: when upgrading the vendored MediaPipe binaries, BUMP CACHE_VERSION
// — /vendor/ is cache-first with no revalidation, so the only way returning
// users pick up new files is the activate-handler purge of the previous cache.
const CACHE_VERSION = 'adermio-v3-1';
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

// Install: pre-cache essential assets.
// Uses Promise.allSettled-style individual puts instead of cache.addAll so a
// single 404 in PRECACHE_ASSETS doesn't reject the install (which would brick
// activation and leave returning users stuck on the previous SW version).
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return Promise.all(
        PRECACHE_ASSETS.map((url) =>
          fetch(url, { cache: 'reload' })
            .then((res) => {
              if (res && res.ok) return cache.put(url, res.clone());
            })
            .catch(() => { /* tolerate individual failures, log nothing in prod */ })
        )
      );
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

// Helper: detect captive-portal / proxy responses that return HTML for binary
// assets. Without this guard, a hotel/airport portal returning 200 OK with a
// login page for /vendor/face_mesh_solution_simd_wasm_bin.wasm would poison
// the SW cache permanently — every subsequent visit would serve the HTML and
// MediaPipe would fail to instantiate with no recovery short of clearing
// site data.
function looksLikeCaptivePortal(request, response) {
  const path = new URL(request.url).pathname.toLowerCase();
  const ct = (response.headers.get('content-type') || '').toLowerCase();
  // Binary asset paths must NOT be served as HTML
  if (path.endsWith('.wasm') && !ct.includes('wasm') && !ct.includes('octet-stream')) return true;
  if ((path.endsWith('.data') || path.endsWith('.binarypb') || path.endsWith('.tflite')) &&
      ct.includes('text/html')) return true;
  // Image / font paths must not be HTML either
  const isBinary = path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg') ||
                   path.endsWith('.webp') || path.endsWith('.woff') || path.endsWith('.woff2') ||
                   path.endsWith('.ttf') || path.endsWith('.otf');
  if (isBinary && ct.includes('text/html')) return true;
  return false;
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

  // HTML pages: network-first.
  // Only cache successful (200) same-origin "basic" responses. Skipping
  // redirects (3xx → response.redirected) and error pages (4xx/5xx) keeps the
  // offline fallback honest — without this, a Vercel error page or auth
  // redirect would replace the real content in the cache.
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok && response.status === 200 &&
              response.type === 'basic' && !response.redirected) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          }
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

  // Immutable assets (vendored MediaPipe, images, fonts): cache-first with a
  // captive-portal guard so HTML masquerading as .wasm/.data is NEVER cached.
  // Without this guard, a single bad response permanently breaks the scan for
  // returning users on that network.
  if (isImmutableAsset(url) || isCDN) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.ok && !looksLikeCaptivePortal(request, response)) {
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
