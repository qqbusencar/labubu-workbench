/* Labubu 治愈工作台 — Service Worker
   离线优先缓存策略 */

const CACHE_NAME = 'labubu-wb-v1.1.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './css/animations.css',
  './css/modules.css',
  './js/db.js',
  './js/utils.js',
  './js/components.js',
  './js/app.js',
  './js/sw-register.js',
  './modules/fitness.js',
  './modules/wellness.js',
  './modules/study.js',
  './modules/fortune.js',
  './modules/news.js',
  './assets/img/labubu-favicon.svg',
  './assets/img/labubu-apple-touch.svg',
  './assets/img/labubu-hero.webp',
  './assets/img/labubu-hero.png',
  './assets/img/labubu-header.png',
  './assets/img/labubu-card.png',
  './assets/img/labubu-medium.png',
  './assets/img/labubu-small.png',
  './assets/img/labubu-thumb.png',
  './assets/img/labubu-tiny.png',
  './assets/img/icon-192.png',
  './assets/img/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // 后台更新缓存
        fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then(c => c.put(event.request, response));
          }
        }).catch(() => {});
        return cached;
      }
      return fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // 离线降级
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});