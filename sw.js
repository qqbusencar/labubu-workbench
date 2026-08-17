/* Hello Kitty 治愈工作台 — Service Worker
   离线优先缓存策略 + Kitty 立绘缓存 */

const CACHE_NAME = 'kitty-wb-v2.0.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './css/animations.css',
  './css/modules.css',
  './js/db.js',
  './js/supabase.js',
  './js/utils.js',
  './js/components.js',
  './js/app.js',
  './js/sw-register.js',
  './modules/fitness.js',
  './modules/wellness.js',
  './modules/study.js',
  './modules/fortune.js',
  './modules/news.js',
  // PWA 图标
  './assets/img/icon-192.png',
  './assets/img/icon-512.png',
  // Kitty 立绘（5 大模块主图，多尺寸）
  './assets/img/kitty/kitty-blocks-tiny.png',
  './assets/img/kitty/kitty-blocks-small.png',
  './assets/img/kitty/kitty-blocks-thumb.png',
  './assets/img/kitty/kitty-blocks-medium.png',
  './assets/img/kitty/kitty-blocks-card.png',
  './assets/img/kitty/kitty-blocks-header.png',
  './assets/img/kitty/kitty-blocks-hero.webp',
  './assets/img/kitty/kitty-tea-tiny.png',
  './assets/img/kitty/kitty-tea-small.png',
  './assets/img/kitty/kitty-tea-thumb.png',
  './assets/img/kitty/kitty-tea-medium.png',
  './assets/img/kitty/kitty-book-tiny.png',
  './assets/img/kitty/kitty-book-small.png',
  './assets/img/kitty/kitty-book-thumb.png',
  './assets/img/kitty/kitty-book-medium.png',
  './assets/img/kitty/kitty-star-sleep-tiny.png',
  './assets/img/kitty/kitty-star-sleep-small.png',
  './assets/img/kitty/kitty-star-sleep-thumb.png',
  './assets/img/kitty/kitty-star-sleep-medium.png',
  './assets/img/kitty/kitty-cart-tiny.png',
  './assets/img/kitty/kitty-cart-small.png',
  './assets/img/kitty/kitty-cart-thumb.png',
  './assets/img/kitty/kitty-cart-medium.png',
  // 通用 hero / 备用
  './assets/img/kitty/kitty-picnic-tiny.png',
  './assets/img/kitty/kitty-picnic-small.png',
  './assets/img/kitty/kitty-picnic-medium.png',
  './assets/img/kitty/kitty-picnic-card.png',
  './assets/img/kitty/kitty-picnic-header.png',
  './assets/img/kitty/kitty-picnic-hero.png',
  './assets/img/kitty/kitty-picnic-hero.webp',
  './assets/img/kitty/kitty-cloud-sleep-tiny.png',
  './assets/img/kitty/kitty-cloud-sleep-small.png',
  './assets/img/kitty/kitty-notebook-tiny.png',
  './assets/img/kitty/kitty-snowglobe-pink-tiny.png',
  './assets/img/kitty/kitty-bag-pink-tiny.png',
  './assets/img/kitty/kitty-airplane-tiny.png',
  './assets/img/kitty/kitty-umbrella-tiny.png',
  './assets/img/kitty/kitty-scooter-tiny.png',
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
