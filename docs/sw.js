/* eslint-disable max-lines-per-function */
/* globals importScripts, writeData, clearAllData, readAllData, deleteItemFromData */
/* eslint-disable no-console, no-restricted-globals */

importScripts('/udemy-pwa/src/js/idb.js');
importScripts('/udemy-pwa/src/js/util.js');

const CACHE_STATIC_NAME = 'static-v2.9.6';
const CACHE_DYNAMIC_NAME = 'dynamic-v2.0.5';

const StaticFiles = [
  '/udemy-pwa/',
  '/udemy-pwa/index.html',
  '/udemy-pwa/offline.html',
  '/udemy-pwa/favicon.ico',
  '/udemy-pwa/manifest.json',
  '/udemy-pwa/src/js/app.js',
  '/udemy-pwa/src/js/feed.js',
  '/udemy-pwa/src/js/idb.js',
  '/udemy-pwa/src/js/util.js',
  '/udemy-pwa/src/js/promise.js',
  '/udemy-pwa/src/js/fetch.js',
  '/udemy-pwa/src/js/material.min.js',
  '/udemy-pwa/src/css/app.css',
  '/udemy-pwa/src/css/feed.css',
  '/udemy-pwa/src/images/main-image-sm.jpg',
  '/udemy-pwa/src/images/main-image.jpg',
  '/udemy-pwa/src/images/main-image-lg.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
];

self.addEventListener('install', event => {
  console.log('[Service Worker] Installing Service Worker ...', event);
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME).then(cache => {
      console.log('[Service Worker] Precaching App Shell');
      cache.addAll(StaticFiles);
    })
  );
});

self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating Service Worker ....', event);
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
            console.log('[Service Worker] Removing old cache.', key);
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
  const url = 'https://pwagram-4d112.firebaseio.com/posts.json';

  if (event.request.url === url) {
    return event.respondWith(
      fetch(event.request).then(res => {
        const clonedRes = res.clone();

        clearAllData('posts')
          .then(() => {
            return clonedRes.json();
          })
          .then(data => {
            return Object.keys(data).map(key => {
              return writeData('posts', data[key]);
            });
          });

        return res;
      })
    );
  } else if (StaticFiles.includes(event.request.url)) {
    return event.respondWith(caches.match(event.request));
  }

  return event.respondWith(
    caches
      .match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(event.request).then(res => {
          caches.open(CACHE_DYNAMIC_NAME).then(cache => {
            cache.put(event.request.url, res.clone());
            return res;
          });
        });
      })
      .catch(() =>
        caches.open(CACHE_STATIC_NAME).then(cache => {
          if (event.request.headers.get('accept').includes('text/html')) {
            return cache.match('/udemy-pwa/offline.html');
          }

          return undefined;
        })
      )
  );
});

self.addEventListener('sync', function backgroundSync(event) {
  console.log('[Service Worker] Background Syncing', event);

  if (event.tag === 'sync-new-posts') {
    console.log('[Service Worker] Syncing new Posts');
    event.waitUntil(
      readAllData('sync-posts').then(data => {
        // eslint-disable-next-line no-restricted-syntax
        for (const dt of data) {
          fetch('https://pwagram-4d112.firebaseio.com/posts.json', {
            method: 'post',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json'
            },
            body: JSON.stringify({
              id: dt.id,
              title: dt.title,
              location: dt.location,
              image: dt.image
            })
          })
            .then(res => {
              if (res.ok) {
                deleteItemFromData('sync-posts', dt.id);
              }
            })
            .catch(error => console.log('send data error', error));
        }
      })
    );
  }
});
