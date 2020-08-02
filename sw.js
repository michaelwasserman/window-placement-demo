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

self.addEventListener('message', function(event){
  console.log("INFO: service worker message: " + event.data);
  if (event.data.sender === "open-window-button") {
    open_window(event);
  }
});

self.addEventListener('notificationclick', async function(event) {
  console.log("INFO: service worker notificationclick");
  open_window(event)
  event.notification.close();
});

function open_window(event) {
  let url = './slide.html'

  // TODO: Expose screen information for service workers?
  // const screens = await self.getScreens();

  // TODO: Support Service Worker's clients.openWindow options onces that lands.
  // let options = { x:      screens[0].left,
  //                 y:      screens[0].top,
  //                 width:  screens[0].width,
  //                 height: screens[0].height,
  //                 type:  "window" }
  // clients.openWindow('./slide.html', options);

  console.log("INFO: Calling openWindow(" + url + /*"," + JSON.stringify(options) +*/ ")");
  return clients.openWindow('./slide.html');
}
