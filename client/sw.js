import { precacheStaticAssets, removeUnusedCaches, ALL_CACHES, ALL_CACHES_LIST } from './sw/caches';

const FALLBACK_IMAGE_URL = 'https://localhost:3100/images/fallback-grocery.png';
const FALLBACK_IMAGES = ALL_CACHES.fallbackImages;

self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      // Get the fallback image
      caches.open(FALLBACK_IMAGES).then(cache => {
        return cache.add(FALLBACK_IMAGE_URL)
      }),
      // Populate the precache stuff
      precacheStaticAssets()
    ])
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    removeUnusedCaches(ALL_CACHES_LIST)
  );
});

function fetchImageOrFallback(fetchEvent) {
  return fetch(fetchEvent.request, {mode: 'cors'})
    .then((response) => {
      if (!response.ok){
        return caches.match(FALLBACK_IMAGE_URL, { cacheName: FALLBACK_IMAGES});
      }
      return response;
    })
    .catch(() => caches.match(FALLBACK_IMAGE_URL, { cacheName: FALLBACK_IMAGES}));
}

function fetchApiJsonWithFallback(event) {
  return caches.open(ALL_CACHES.fallback)
    .then(cache => {
      return fetch(event.request)
        .then(res => {
          if (res.ok) cache.put(event.request, res.clone());
          return res;
        })
        .catch(() =>
          cache.match(event.request));
    });
}  

self.addEventListener('fetch', event => {
  let acceptHeader = event.request.headers.get('accept');
  let requestUrl = new URL(event.request.url);
  let isGroceryImage = acceptHeader.indexOf('image/*') >= 0 && requestUrl.pathname.indexOf('/images/') === 0;
  let isFromApi = requestUrl.origin.indexOf('localhost:3100') >= 0;
  event.respondWith(
    caches.match(event.request, { cacheName: ALL_CACHES.prefetch })
      .then(response => {
        // Cache hit! Return the precached response
        if (response) return response;
        // Handle grocery images
        if (acceptHeader && isGroceryImage) {
          return fetchImageOrFallback(event)
        } else if (isFromApi && event.request.method === 'GET') {
          return  fetchApiJsonWithFallback(event)
        } else {
          // Everything else falls back to the network
          return fetch(event.request);
        }
      })
  );
});