/* eslint-disable no-restricted-globals */
/* globals workbox, importScripts, clearAllData, writeData, readAllData, deleteItemFromData, clients */

importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js'
);
importScripts('/src/js/idb.js');
importScripts('/src/js/util.js');

workbox.core.skipWaiting();

workbox.routing.registerRoute(
  /.*fonts\.(?:googleapis|gstatic)\.com.*$/u,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'google-fonts',
    plugins: [
      new workbox.expiration.Plugin({
        maxEntries: 5,
        maxAgeSeconds: 60 * 60 * 24 * 30
      })
    ]
  })
);

workbox.routing.registerRoute(
  'https://pwagram-4d112.firebaseio.com/posts.json',
  args =>
    fetch(args.event.request).then(res => {
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

workbox.routing.setDefaultHandler(
  new workbox.strategies.StaleWhileRevalidate()
);

workbox.routing.setCatchHandler(({ event }) => {
  switch (event.request.destination) {
    case 'document': {
      const key = workbox.precaching.getCacheKeyForURL('/offline.html');
      return caches.match(key);
    }

    default: {
      return Response.error();
    }
  }
});

workbox.routing.registerRoute(
  /.*(?:googleapis|gstatic)\.com.*$/u,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'post-images'
  })
);

workbox.routing.registerRoute(
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'material-css'
  })
);

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

workbox.precaching.precacheAndRoute([]);
