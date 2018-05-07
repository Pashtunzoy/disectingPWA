import { precacheStaticAssets, removeUnusedCaches, ALL_CACHES, ALL_CACHES_LIST } from './sw/caches';

const currentCache = 'assets-v1';
const fallBackImage = 'https://localhost:3100/images/fallback-vegetables.png';
console.log(ALL_CACHES);
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(currentCache)
        .then(cache => cache.add(fallBackImage)),
      precacheStaticAssets()
    ])
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      removeUnusedCaches(ALL_CACHES_LIST),
      removeUnusedCaches(currentCache)
    ])
  )
});

self.addEventListener('fetch', event => {
  const acceptHeader = event.request.headers.get('accept');
  const requestUrl = new URL(event.request.url);

  if(acceptHeader.indexOf('image/*') >= 0 &&
  requestUrl.pathname.indexOf('/images/') === 0) {
    event.respondWith(
      fetchFallBackImage(event)
    );
  }
});


// function fetchAssets() {
//   const assets = [];
//   fetch(ASSET_URL)
//     .then(res => res.json())
//     .then(data => {
//       for (let i in data) {
//         assets.push(data[i]);
//       }
//     })
//     .catch(err => console.log(err))
//   return assets;
// }


function fetchFallBackImage(e) {
  // debugger;
  return fetch(e.request, {
    mode: 'cors',
    credentials: 'omit'
  })
    .then(res => {
      if (!res.ok) {
        return caches.match(fallBackImage, { cacheName: currentCache });
      } else {
        return res;
      }
    }).catch(err =>
      caches.match(fallBackImage, { cacheName: currentCache })
    )
}