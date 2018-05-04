
const currentCache = 'assets-v2';
const fallBackImage = 'https://localhost:3100/images/fallback-vegetables.png';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(currentCache).then(cache => {
      cache.add(fallBackImage);
      return cache.addAll(
        fetch('/asset-manifest.json')
          .then(res => res.json())
          .then(data => data)
          .catch(err => console.log(err))
      )
    })
  );
});

self.addEventListener('activate', event => {
  console.log('service worker activated: ', event);
});

self.addEventListener('fetch', event => {
  const acceptHeader = event.request.headers.get('accept');
  const requestUrl = new URL(event.request.url);

  event.respondWith(
    caches.match(event.request)
      .then(res => res || fetch(event.request.url))
      .catch(() => caches.match(event.request))
  )
  // if(acceptHeader.indexOf('image/*') >= 0 &&
  // requestUrl.pathname.indexOf('/images/') === 0) {

  //   event.respondWith(
  //     fetch(event.request.url)
  //       .then(res => {
  //         if (!res.ok) {
  //           return caches.match(fallBackImage, { cacheName: currentCache});
  //         } else {
  //           return res;
  //         }
  //       }).catch(err => 
  //         caches.match(fallBackImage, { cacheName: currentCache })
  //       )
  //   );
  // }
});