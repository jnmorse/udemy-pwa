/* eslint-disable max-lines-per-function */
/* globals importScripts, writeData, clearAllData, deleteItemFromData */
/* eslint-disable no-console, no-restricted-globals */

importScripts('/src/js/idb.js');
importScripts('/src/js/util.js');

const CACHE_STATIC_NAME = 'static-v2.3.5';
const CACHE_DYNAMIC_NAME = 'dynamic-v2.0.4';

const StaticFiles = [
  '/',
  '/index.html',
  '/offline.html',
  '/favicon.ico',
  '/manifest.json',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/idb.js',
  '/src/js/util.js',
  '/src/js/promise.js',
  '/src/js/fetch.js',
  '/src/js/material.min.js',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/images/main-image.jpg',
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
            return cache.match('/offline.html');
          }

          return undefined;
        })
      )
  );
});