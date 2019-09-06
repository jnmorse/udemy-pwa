/* globals clients, importScripts, writeData, clearAllData, readAllData, deleteItemFromData */
/* eslint-disable no-console, no-restricted-globals, consistent-return, array-callback-return, max-lines-per-function  */

importScripts('/src/js/idb.js');
importScripts('/src/js/util.js');

const CACHE_STATIC_NAME = 'static-v3.6.3';
const CACHE_DYNAMIC_NAME = 'dynamic-v2.1.0';

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

  const reqUrl = new URL(event.request.url);

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
  } else if (
    StaticFiles.includes(reqUrl.href) ||
    StaticFiles.includes(reqUrl.pathname)
  ) {
    event.respondWith(caches.match(event.request));
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
          const postData = new FormData();

          postData.append('id', dt.id);
          postData.append('title', dt.title);
          postData.append('location', dt.location);
          postData.append('rawLocation', dt.rawLocation);
          postData.append('file', dt.picture, `${dt.id}.png`);
          fetch(
            'https://us-central1-pwagram-4d112.cloudfunctions.net/storePostData',
            {
              method: 'post',
              body: postData
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

self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Noticication Click', event);

  const { notification, action } = event;

  switch (action) {
    case 'confirm': {
      console.log('confirm was choosen');
      notification.close();
      break;
    }

    default: {
      console.log('some action', action);
      event.waitUntil(
        clients.matchAll().then(clis => {
          const client = clis.find(c => c.visibilityState === 'visible');

          if (client !== undefined) {
            client.navigate(notification.data.url);
            client.focus();
          } else {
            clients.openWindow(notification.data.url);
          }
        })
      );
      notification.close();
    }
  }
});

self.addEventListener('notificationclose', event => {
  console.log('[Service Worker] Notification was closed', event);
});

self.addEventListener('push', event => {
  console.log('[Service Worker] Push Notification received', event);

  let data = { title: 'New', content: 'Something new happended', openUrl: '/' };

  if (event.data) {
    data = JSON.parse(event.data.text());
  }

  const options = {
    body: data.content,
    icon: '/src/images/icons/app-icon-96x96.png',
    image: '/src/images/sf-boat.jpg',
    data: {
      url: data.openUrl
    }
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});
