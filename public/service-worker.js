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

workbox.precaching.precacheAndRoute([
  {
    "url": "404.html",
    "revision": "0a27a4163254fc8fce870c8cc3a3f94f"
  },
  {
    "url": "favicon.ico",
    "revision": "2cab47d9e04d664d93c8d91aec59e812"
  },
  {
    "url": "index.html",
    "revision": "62831079ef4260d7aa2509f1ee8b4891"
  },
  {
    "url": "manifest.json",
    "revision": "355562c440254b1b7be1f5f7cbe1be0a"
  },
  {
    "url": "offline.html",
    "revision": "f39b3b38b2b7e9c08371d84efa48092c"
  },
  {
    "url": "src/css/app.css",
    "revision": "1abbde663956dfc2187271e9421b62e2"
  },
  {
    "url": "src/css/feed.css",
    "revision": "d07284548d20642c4530bec49d6873a3"
  },
  {
    "url": "src/css/help.css",
    "revision": "1c6d81b27c9d423bece9869b07a7bd73"
  },
  {
    "url": "src/js/app.js",
    "revision": "b9c88346d1c19c4b6ac3b4dd1752a671"
  },
  {
    "url": "src/js/feed.js",
    "revision": "d57806197cbe223a032603ddfc8af170"
  },
  {
    "url": "src/js/fetch.js",
    "revision": "339eb7e032018ac7704468863a91c874"
  },
  {
    "url": "src/js/idb.js",
    "revision": "6728a8fd0842c3402de8945c6762fb90"
  },
  {
    "url": "src/js/material.min.js",
    "revision": "713af0c6ce93dbbce2f00bf0a98d0541"
  },
  {
    "url": "src/js/promise.js",
    "revision": "49225334ef3de626ef2b975e6c9dadd8"
  },
  {
    "url": "src/js/util.js",
    "revision": "7116c05b93ad9fbcd7a873ac77e3a503"
  },
  {
    "url": "sw-base.js",
    "revision": "98f1cbcf3f4bbcbc5a624ada2e609c76"
  },
  {
    "url": "sw.js",
    "revision": "3e7c75195f3a0b7af05c046f80b08ad3"
  },
  {
    "url": "src/images/main-image-lg.jpg",
    "revision": "31b19bffae4ea13ca0f2178ddb639403"
  },
  {
    "url": "src/images/main-image-sm.jpg",
    "revision": "c6bb733c2f39c60e3c139f814d2d14bb"
  },
  {
    "url": "src/images/main-image.jpg",
    "revision": "5c66d091b0dc200e8e89e56c589821fb"
  },
  {
    "url": "src/images/sf-boat.jpg",
    "revision": "0f282d64b0fb306daf12050e812d6a19"
  }
]);
