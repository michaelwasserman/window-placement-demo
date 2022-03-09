let cacheName = 'screen-and-window-demo';
let filesToCache = [
  '.',
  'favicon-512.png',
  'favicon.ico',
  'index.html',
  'main.js',
  'notes.html',
  'popup.html',
  'slide.html',
  'style.css',
];

// Start the service worker and cache all of the app's content
self.addEventListener('install', function(event) {
  event.waitUntil(caches.open(cacheName).then(function(cache) {
    return cache.addAll(filesToCache);
  }));
});

// Serve cached content when offline
self.addEventListener('fetch', function(event) {
  event.respondWith(
    // TODO: Update cache with fetch response.
    fetch(event.request).catch(function() {
      return caches.match(event.request);
    })
  );
});