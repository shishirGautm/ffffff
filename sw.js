const CACHE_NAME = 'futsal-nepal-shell-v6';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css?v=20260927-2',
  './css/responsive.css?v=20260912',
  './js/install.js?v=20260927-1',
  './assets/logo.svg',
  './assets/favicon.svg'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(APP_SHELL);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(cacheNames.filter(function(cacheName) {
        return cacheName !== CACHE_NAME;
      }).map(function(cacheName) {
        return caches.delete(cacheName);
      }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).then(function(response) {
      if (event.request.url.startsWith(self.location.origin)) {
        const responseCopy = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseCopy);
        });
      }
      return response;
    }).catch(function() {
      return caches.match(event.request).then(function(cachedResponse) {
        return cachedResponse || caches.match('./index.html');
      });
    })
  );
});