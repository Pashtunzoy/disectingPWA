
const currentCache = 'assets-v2';
const fallBackImage = 'https://localhost:3100/images/fallback-vegetables.png';
const ASSET_URL = '/asset-manifest.json';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(currentCache).then(cache => {
      cache.add(fallBackImage);
      return cache.addAll(fetchAssets);
    })
  );
});

self.addEventListener('activate', event => {
  event.respondWith(
    fetch(event.request).then(data => {
      console.log(data);
    })
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
  event.respondWith(
    caches.match(ASSET_URL)
      .then(res => res.json())
      .then(data => data)
      .catch(err => fetch(event.request))
  )
});


function fetchAssets() {
  const assets = [];
  fetch(ASSET_URL)
    .then(res => res.json())
    .then(data => {
      for (let i in data) {
        assets.push(data[i]);
      }
    })
    .catch(err => console.log(err))
  return assets;
}


function fetchFallBackImage(e) {
  fetch(e.request.url, {
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