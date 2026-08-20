const CACHE_NAME = 'breachos-v52';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './robots.txt',
  './sitemap.xml',
  './privacy.html',
  './icons/favicon.svg',
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
  './css/themes.css',
  './css/konami.css',
  './css/sound-themes.css',
  './css/survival.css',
  './css/daily.css',
  './css/responsive.css',
  './css/auth.css',
  './css/leaderboard.css',
  './css/gameplay-mods.css',
  './css/quests.css',
  './css/colorblind.css',
  './css/weekly.css',
  './js/load-partials.js',
  './js/sound.js',
  './js/haptic-patterns.js',
  './js/haptics.js',
  './js/data.js',
  './js/stats-rules.js',
  './js/rank.js',
  './js/game.js',
  './js/board.js',
  './js/collections.js',
  './js/dossier.js',
  './js/sound-themes.js',
  './js/konami.js',
  './js/share.js',
  './js/themes.js',
  './js/achievements.js',
  './js/survival-rules.js',
  './js/survival.js',
  './js/daily.js',
  './js/weekly.js',
  './js/login-streak.js',
  './js/ui.js',
  './js/auth.js',
  './js/leaderboard.js',
  './js/quests.js',
  './partials/rules-modal.html',
  './partials/mobile-menu.html',
  './partials/controls.html',
  './partials/skin-modal.html',
  './partials/dossier-modal.html',
  './partials/theme-modal.html',
  './partials/sound-theme-modal.html',
  './partials/achievement-popup.html',
  './partials/collection-modal.html',
  './partials/auth-modal.html',
  './partials/leaderboard-modal.html',
  './partials/quests-modal.html',
  './partials/game-area.html',
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

// Fetch — network-first, cache fallback for offline
globalThis.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
