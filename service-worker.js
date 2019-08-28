self.addEventListener('install', event => {
  console.log("MSW service worker install event");
});

self.addEventListener('activate', event => {
  console.log("MSW service worker activate event");
});

self.addEventListener('message', function(event){
  console.log("MSW service worker message: " + event.data);
  open_window(event);
});

self.addEventListener('notificationclick', function(event) {
  console.log("MSW service worker notificationclick");
  event.notification.close();
  open_window(event);
});

function open_window(event) {
  const promise = clients.openWindow('https://google.com');
  // event.waitUntil(promise);

  // try {
  //   console.log("MSW calling openWindow");
  //   const promise = clients.openWindow('https://google.com');
  //   if (promise !== undefined) {
  //     promise.then(_ => {
  //       console.log("MSW openWindow ok");
  //     }).catch(error => {
  //       console.log("MSW openWindow fail: " + error);
  //     });
  //   } else {
  //     console.log("MSW openWindow fail (undefined?)");
  //   }
  //   console.log("MSW waiting for openWindow promise");
  //   // event.waitUntil(promise);
  // } catch (error) {
  //   console.log("MSW caught error:" + error);
  // }
}