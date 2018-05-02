
let counter = 0;

self.addEventListener('install', event => {
  console.log(`Counter is counting in install: ${++counter}`);
});
self.addEventListener('activate', event => {
  console.log('service worker activated: ', event);
});
self.addEventListener('fetch', event => {
  console.log('Fetch Request is made: ', event.request.url);
});