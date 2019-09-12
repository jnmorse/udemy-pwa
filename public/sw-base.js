/* globals workbox, importScripts, clearAllData, writeData */

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

workbox.precaching.precacheAndRoute([]);
