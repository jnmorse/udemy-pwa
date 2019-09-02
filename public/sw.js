/* eslint-disable no-console, no-restricted-globals */
const STATIC_VERSION = 'static-v2.0.0';
const DYNAMIC_VERSION = 'dynamic-v2.0.0';

self.addEventListener('install', event => {
  console.log('[Service Worker] Installing Service Worker ...', event);
  event.waitUntil(
    caches.open(STATIC_VERSION).then(cache => {
      cache.addAll([
        '/',
        '/favicon.ico',
        '/index.html',
        '/src/js/app.js',
        '/src/js/feed.js',
        '/src/js/fetch.js',
        '/src/js/promise.js',
        '/src/js/material.min.js',
        '/src/images/main-image.jpg',
        '/src/css/app.css',
        '/src/css/feed.css',
        'https://fonts.googleapis.com/css?family=Roboto:400,700',
        'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
        'https://fonts.googleapis.com/icon?family=Material+Icons'
      ]);
    })
  );
});

self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating Service Worker ....', event);
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== STATIC_VERSION && key !== DYNAMIC_VERSION) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }

          return null;
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response;
      }

      return fetch(event.request)
        .then(res => {
          caches.open(DYNAMIC_VERSION).then(cache => {
            // res.clone() clones the response so it still avaible
            cache.put(event.request.url, res.clone());
            return res;
          });
        })
        .catch(() => null);
    })
  );
});
