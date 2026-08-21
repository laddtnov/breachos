const CACHE_NAME = 'breachos-v61';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './robots.txt',
  './sitemap.xml',
  './privacy.html',
  './icons/favicon.svg',
  './dist/app.min.css',
  './dist/app.min.js',
  './partials/rules-modal.html',
  './partials/mobile-menu.html',
  './partials/controls.html',
  './partials/dossier-modal.html',
  './partials/customise-modal.html',
  './partials/settings-modal.html',
  './partials/achievement-popup.html',
  './partials/auth-modal.html',
  './partials/leaderboard-modal.html',
  './partials/quests-modal.html',
  './partials/game-area.html',
];

// Install — cache all assets
globalThis.addEventListener('install', event => {
  event.waitUntil(
    // cache: 'reload' bypasses the HTTP cache for the precache fetches. Assets
    // are served with a one-hour max-age and their filenames are not
    // content-hashed, so a plain addAll() could fill a brand new cache with the
    // previous release's files and pin players to stale code.
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(ASSETS.map(url => new Request(url, { cache: 'reload' })))
    )
  );
  globalThis.skipWaiting();
});

// Activate — clean old caches
globalThis.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  globalThis.clients.claim();
});

// Which requests this worker is willing to handle at all.
//
// cache.put() rejects outright on schemes it does not support, and browser
// extensions send chrome-extension:// requests through the page — that was
// throwing "Request scheme 'chrome-extension' is unsupported" on every one.
//
// /api/ is left alone deliberately: those responses are per-user and
// authenticated, and storing them in the static asset cache would leave one
// player's stats on disk for the next person to use the device.
function isCacheable(request) {
  const url = new URL(request.url);
  return request.method === 'GET'
    && url.origin === globalThis.location.origin
    && (url.protocol === 'https:' || url.protocol === 'http:')
    && !url.pathname.startsWith('/api/');
}

// Fetch — network-first, cache fallback for offline
globalThis.addEventListener('fetch', event => {
  // Not calling respondWith leaves the request to the browser untouched, which
  // is what anything this worker should not be caching wants anyway.
  if (!isCacheable(event.request)) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => cache.put(event.request, copy))
          // A failed cache write must not reject the fetch the page is waiting
          // on, and must not surface as an unhandled rejection either.
          .catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
