const CACHE_NAME = 'cybermatch-v14';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/base.css',
  './css/hud.css',
  './css/cards.css',
  './css/skins.css',
  './css/modals.css',
  './css/overlays.css',
  './css/controls.css',
  './css/combo.css',
  './css/achievements.css',
  './css/collections.css',
  './css/dossier.css',
  './css/donations.css',
  './css/themes.css',
  './css/konami.css',
  './css/sound-themes.css',
  './css/survival.css',
  './css/daily.css',
  './css/responsive.css',
  './js/sound.js',
  './js/data.js',
  './js/rank.js',
  './js/game.js',
  './js/collections.js',
  './js/dossier.js',
  './js/sound-themes.js',
  './js/konami.js',
  './js/share.js',
  './js/themes.js',
  './js/donations.js',
  './js/achievements.js',
  './js/survival.js',
  './js/daily.js',
  './js/ui.js',
];

// Install — cache all assets
globalThis.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
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

// Fetch — cache-first, fallback to network
globalThis.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
