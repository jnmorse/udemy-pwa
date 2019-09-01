/* eslint-disable no-console, no-restricted-globals */
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing Service Worker ...', event);
  event.waitUntil(
    caches.open('static-v2').then(cache => {
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
          if (key !== 'static-v2' || key !== 'dynamic') {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
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
          caches.open('dynamic').then(cache => {
            // res.clone() clones the response so it still avaible
            cache.put(event.request.url, res.clone());
            return res;
          });
        })
        .catch(() => null);
    })
  );
});
