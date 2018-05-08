import { precacheStaticAssets, removeUnusedCaches, ALL_CACHES, ALL_CACHES_LIST } from './sw/caches';


const fallBackImage = 'https://localhost:3100/images/fallback-vegetables.png';

self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(ALL_CACHES.fallbackImages)
        .then(cache => cache.add(fallBackImage)),
      precacheStaticAssets()
    ])
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      removeUnusedCaches(ALL_CACHES_LIST)
    ])
  )
});

self.addEventListener('fetch', event => {
  const acceptHeader = event.request.headers.get('accept');
  const requestUrl = new URL(event.request.url);
  event.respondWith(
    caches.match(event.request, { cacheName: ALL_CACHES.prefetch })
      .then(res => {
        // Return Cache if it is matched
        if (res) return res;

        if(acceptHeader.indexOf('image/*') >= 0 &&
        requestUrl.pathname.indexOf('/images/') === 0) {
          return fetchFallBackImage(event);
        }
        
        // If no cache is found, fetch resources from the web
        return fetch(event.request);
      })
  )
});


function fetchFallBackImage(e) {
  // debugger;
  return fetch(e.request, {
    mode: 'cors',
    credentials: 'omit'
  })
    .then(res => {
      if (!res.ok) {
        return caches.match(fallBackImage, { cacheName: ALL_CACHES.fallbackImages });
      } else {
        return res;
      }
    }).catch(err =>
      caches.match(fallBackImage, { cacheName: ALL_CACHES.fallbackImages })
    )
}