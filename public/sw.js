/* eslint-disable consistent-return */
/* eslint-disable array-callback-return */
/* eslint-disable max-lines-per-function */
/* globals importScripts, writeData, clearAllData, readAllData, deleteItemFromData */
/* eslint-disable no-console, no-restricted-globals */

importScripts('/src/js/idb.js');
importScripts('/src/js/util.js');

const CACHE_STATIC_NAME = 'static-v3.1.0';
const CACHE_DYNAMIC_NAME = 'dynamic-v2.0.5';

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
  '/src/images/main-image-sm.jpg',
  '/src/images/main-image.jpg',
  '/src/images/main-image-lg.jpg',
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
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = 'https://pwagram-4d112.firebaseio.com/posts.json';
  if (event.request.url.indexOf(url) > -1) {
    event.respondWith(
      fetch(event.request).then(res => {
        const clonedRes = res.clone();
        clearAllData('posts')
          .then(() => {
            return clonedRes.json();
          })
          .then(data => {
            Object.keys(data).forEach(key => {
              writeData('posts', data[key]);
            });
          });
        return res;
      })
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then(res => {
            return caches.open(CACHE_DYNAMIC_NAME).then(cache => {
              // trimCache(CACHE_DYNAMIC_NAME, 3);
              cache.put(event.request.url, res.clone());
              return res;
            });
          })
          .catch(() => {
            return caches.open(CACHE_STATIC_NAME).then(cache => {
              if (event.request.headers.get('accept').includes('text/html')) {
                return cache.match('/offline.html');
              }
            });
          });
      })
    );
  }
});

self.addEventListener('sync', function backgroundSync(event) {
  console.log('[Service Worker] Background Syncing', event);

  if (event.tag === 'sync-new-posts') {
    console.log('[Service Worker] Syncing new Posts');
    event.waitUntil(
      readAllData('sync-posts').then(data => {
        // eslint-disable-next-line no-restricted-syntax
        for (const dt of data) {
          fetch(
            'https://us-central1-pwagram-4d112.cloudfunctions.net/storePostData',
            {
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
            }
          )
            .then(res => {
              if (res.ok) {
                res.json().then(resData => {
                  deleteItemFromData('sync-posts', resData.id);
                });
              }
            })
            .catch(error => console.log('send data error', error));
        }
      })
    );
  }
});
