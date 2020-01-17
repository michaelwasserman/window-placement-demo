var cacheName = 'screen-and-window-demo';
var filesToCache = [
  'index.html',
  'style.css',
  'main.js',
  'slide.html',
  'favicon-512.png',
];

// Start the service worker and cache all of the app's content
self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(cacheName).then(function(cache) {
    return cache.addAll(filesToCache);
  }));
});

// Serve cached content when offline
self.addEventListener('fetch', function(e) {
  e.respondWith(caches.match(e.request).then(function(response) {
    return response || fetch(e.request);
  }));
});

self.addEventListener('message', function(event){
  console.log("INFO: service worker message: " + event.data);
  if (event.data.sender === "open-window-button") {
    open_window(event);
  }
});

self.addEventListener('notificationclick', async function(event) {
  console.log("INFO: service worker notificationclick");
  clients.openWindow('./slide.html');
  event.notification.close();

  // TODO: Expose screen information for service workers?
  // TODO: Support Service Worker's clients.openWindow options onces that lands.
  // const screens = await self.getScreens();
  // var options = { x:      screens[0].left,
  //                 y:      screens[0].top,
  //                 width:  screens[0].width,
  //                 height: screens[0].height,
  //                 type:  "window" }
  // clients.openWindow('./slide.html', options);
});

function open_window(event) {
  // var url = './slide.html'
  // var options = { x:50, y:100, width:400, height:200, type:"window"}
  // if (event && event.data && event.data.url.length != 0)
  //   url = event.data.url;
  // if (event && event.data && event.data.options)
  //   options = event.data.options;
  // console.log("INFO: Calling openWindow(" + url + "," + JSON.stringify(options) + ")");
  // const promise = clients.openWindow(url, options);
  // TODO: event.waitUntil(promise); ? 
}

// function cautious_open_window(event) {
//   try {
//     console.log("INFO: calling openWindow");
//     const promise = clients.openWindow('./slide.html', { x:100, y:100, width:300, height:300, type:"window"});
//     if (promise !== undefined) {
//       promise.then(_ => {
//         console.log("INFO: openWindow ok");
//       }).catch(error => {
//         console.log("INFO: openWindow fail: " + error);
//       });
//     } else {
//       console.log("INFO: openWindow fail (undefined?)");
//     }
//     console.log("INFO: waiting for openWindow promise");
//     // event.waitUntil(promise);
//   } catch (error) {
//     console.log("INFO: caught error:" + error);
//   }
// }
