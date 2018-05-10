import { precacheStaticAssets, removeUnusedCaches, ALL_CACHES, ALL_CACHES_LIST } from './sw/caches';
import idb from 'idb';

const FALLBACK_IMAGE_URLS = ['grocery', 'bakery', 'dairy', 'frozen', 'fruit', 'herbs', 'meat', 'vegetables']
  .map(name => `https://localhost:3100/images/fallback-${name}.png`);
const FALLBACK_IMAGES = ALL_CACHES.fallbackImages;
const INDEX_HTML_PATH = '/';
const INDEX_HTML_URL = new URL(INDEX_HTML_PATH, self.location).toString();

// IndexedDB Implementation

function indexDBConnect() {
  return idb.open('groceryItem-store', 1, upgradeDB => {
    switch(upgradeDB.oldVersion) {
    case 0: upgradeDB.createObjectStore('groceryItems', { keyPath: 'id' });
    }
  });
}

function populateWithGroceryItems() {
  return indexDBConnect().then(db => {
    fetch('https://localhost:3100/api/grocery/items?limit=9999')
      .then(res => res.json())
      .then(({ data: groceryItems }) => {
        let tx = db.transaction('groceryItems', 'readwrite');
        tx.objectStore('groceryItems').clear();
        tx.complete.then(() => {
          let tx2 = db.transaction('groceryItems', 'readwrite');
          groceryItems.forEach(groceryItem => {
            tx2.objectStore('groceryItems').put(groceryItem);
          });
          return tx2.complete;
        });
      });
  });
}


function groceryItemDb() {
  return idb.open('groceryitem-store', 1, upgradeDb => {
    switch(upgradeDb.oldVersion) {
    // deliberately allow fall-through case blocks
    case 0:
      // initial setup
      upgradeDb.createObjectStore('grocery-items', { keyPath: 'id' });
    }
  })
}

/**
 * @return {Promise}
 */
function downloadGroceryItems() {
  groceryItemDb().then(db => {
    fetch('https://localhost:3100/api/grocery/items?limit=99999')
      .then(response => response.json())
      .then( ({ data: groceryItems }) => {
        let tx = db.transaction('grocery-items', 'readwrite');
        tx.objectStore('grocery-items').clear();
        return tx.complete.then(() => {
          let txx = db.transaction('grocery-items', 'readwrite');
          let store = txx.objectStore('grocery-items');
          groceryItems.forEach(groceryItem => store.put(groceryItem));
          return txx.complete;
        });
      })
  })
}

self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      // Get the fallback image
      caches.open(FALLBACK_IMAGES).then(cache => {
        return cache.addAll(FALLBACK_IMAGE_URLS)
      }),
      // Populate the precache stuff
      precacheStaticAssets(),
      // Insert Data to IndexDB
      populateWithGroceryItems()
    ])
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    removeUnusedCaches(ALL_CACHES_LIST)
  );
});

function fallbackImageForRequest(request) {
  let url = new URL(request.url);
  let pathName = url.pathname;
  let itemId = parseInt(pathName.substring(pathName.lastIndexOf('/') + 1, pathName.lastIndexOf('.')), 10);
  return groceryItemDb().then(db => {
    let tx = db.transaction('grocery-items');
    let store = tx.objectStore('grocery-items');
    return store.get(itemId);
  }).then(groceryItem => {
    let { category } = groceryItem;
    return caches.match(`https://localhost:3100/images/fallback-${category.toLowerCase() || 'grocery'}.png`, { cacheName: FALLBACK_IMAGES})
  })
}

function fetchImageOrFallback(fetchEvent) {
  return fetch(fetchEvent.request, {mode: 'cors'})
    .then((response) => {
      let clonedResponse = response.clone();
      if (!response.ok){
        return fallbackImageForRequest(fetchEvent.request);
      }
      caches.open(ALL_CACHES.fallback).then(cache => {        
        // Successful response
        if (response.ok) {
          // Begin the process of adding the response to the cache
          cache.put(fetchEvent.request, clonedResponse);
        }
      })
      return response;
    })
    .catch(() => {
      return caches.match(fetchEvent.request, {cacheName: ALL_CACHES.fallback}).then(response => {
        return response || fallbackImageForRequest(fetchEvent.request);
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
  return fetch(fetchEvent.request)
    .catch(() => caches.match(INDEX_HTML_URL, { cacheName: ALL_CACHES.prefetch }))
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