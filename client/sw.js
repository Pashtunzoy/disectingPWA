import { precacheStaticAssets, removeUnusedCaches, ALL_CACHES, ALL_CACHES_LIST } from './sw/caches';

const FALLBACK_IMAGE_URL = 'https://localhost:3100/images/fallback-grocery.png';
const FALLBACK_IMAGES = ALL_CACHES.fallbackImages;
const INDEX_HTML_PATH = '/';
const INDEX_HTML_URL = new URL(INDEX_HTML_PATH, self.location).toString();

self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      // Get the fallback image
      caches.open(FALLBACK_IMAGES).then(cache => {
        return cache.add(FALLBACK_IMAGE_URL)
      }),
      // Populate the precache stuff
      caches.open(ALL_CACHES.prefetch)
        .then(cache => cache.add(INDEX_HTML_URL)),
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
      let responseClone = response.clone();
      if (!response.ok){
        return caches.match(FALLBACK_IMAGE_URL);
      }
      caches.open(ALL_CACHES.fallback).then(cache => {        
        // Successful response
        if (response.ok) {
          // Begin the process of adding the response to the cache
          cache.put(fetchEvent.request, responseClone);
        }
      })
      return response;
    })
    .catch(() => {
      return caches.match(fetchEvent.request, {cacheName: ALL_CACHES.fallback}).then(response => {
        return response || caches.match(FALLBACK_IMAGE_URL, { cacheName: FALLBACK_IMAGES});
      });
    })
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

function fetchIndexHTMLWithFallback(fetchEvent) {
  return caches.open(ALL_CACHES.fallback)
    .then(cache => {
      return fetch(fetchEvent.request)
        .then(res => {
          if (res.ok) cache.put(fetchEvent.request, res.clone());
          return res;
        })
        .catch(() => 
          cache.match(INDEX_HTML_URL, { cacheName: ALL_CACHES.prefetch }));
    });
}

self.addEventListener('fetch', event => {
  let acceptHeader = event.request.headers.get('accept');
  let requestUrl = new URL(event.request.url);
  let isHTMLRequest = event.request.headers.get('accept').indexOf('text/html') !== - 1;
  let isLocal = new URL(event.request.url).origin === location.origin;

  let isGroceryImage = acceptHeader.indexOf('image/*') >= 0 
    && requestUrl.pathname.indexOf('/images/') === 0;

  let isFromApi = requestUrl.origin.indexOf('localhost:3100') >= 0;

  event.respondWith(
    caches.match(event.request, { cacheName: ALL_CACHES.prefetch })
      .then(response => {
        // Cache hit! Return the precached response
        if (response) return response;
        // Handle grocery images
        if (acceptHeader && isGroceryImage) {
          // Fallback to the fallbackimage from cache, if the image is not found
          return fetchImageOrFallback(event)
        } else if (isFromApi && event.request.method === 'GET') {
          // Fetch fresh JSON API everytime but when network fials, return cached data
          return  fetchApiJsonWithFallback(event)
        } else if (isHTMLRequest && isLocal) {
          // Fetch the index.html in case of no network
          return fetchIndexHTMLWithFallback(event);
        } else {
          // Everything else falls back to the network
          return fetch(event.request);
        }
      })
  );
});