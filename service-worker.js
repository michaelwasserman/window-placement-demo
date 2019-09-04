self.addEventListener('install', event => {
  console.log("MSW service worker install");
});

self.addEventListener('activate', event => {
  console.log("MSW service worker activate");
});

addEventListener('fetch', event => {
  event.waitUntil(async function() {
    // Exit early if we don't have access to the client.
    // Eg, if it's cross-origin.
    if (!event.clientId) return;

    // Get the client.
    const client = await clients.get(event.clientId);
    // Exit early if we don't get the client.
    // Eg, if it closed.
    if (!client) return;

    // Send a message to the client.
    client.postMessage({
      msg: "Hey I just got a fetch from you!",
      url: event.request.url
    });
   
  }());
});


self.addEventListener('message', function(event){
  console.log("MSW service worker message: " + event.data);

  // TODO(msw): event.waitUntil?
  event.waitUntil(async function() {
    // Exit early if we don't have access to the client.
    if (!event.clientId) return;

    // Get the client.
    const client = await clients.get(event.clientId);
    // Exit early if we don't get the client.
    // Eg, if it closed.
    if (!client) return;

    // Send a message to the client.
    client.postMessage({
      msg: "Hey I just got a fetch from you!",
      url: event.request.url
    });
  })


  displays = getDisplays().then(async function(displays) {
    if (event.data === "show-displays-button") {
      console.log("MSW posting message to client...");
      event.ports[0].postMessage(displays);
      // if (!event.clientId) {
      //   console.log("MSW unknown client");
      //   return;
      // }
      // const client = await clients.get(event.clientId);
      // console.log("MSW posting message to client: " + client);
      // client.postMessage({ msg: "update displays", displays: displays });
    } else if (event.data === "open-window-button") {
      open_window(event);
    } else if (event.data === "present-slides-button") {
      present_slides(event, displays);
    } else if (event.data === "open-dashboard-button") {
      open_dashboard(event);
    }
  })
});

self.addEventListener('notificationclick', function(event) {
  console.log("MSW service worker notificationclick");
  event.notification.close();
  open_window(event);
});

var getDisplays = async function() {
  console.log("MSW getDisplays");
  const displays = await navigator.screen.requestDisplays();
  console.log("MSW displays: " + displays.length);
  // for (const display of displays) {
  //   console.log("name: " + display.name);
  //   console.log("scaleFactor: " + display.scaleFactor);
  //   console.log("width: " + display.width);
  //   console.log("height: " + display.height);
  //   console.log("left: " + display.left);
  //   console.log("top: " + display.top);
  //   console.log("colorDepth: " + display.colorDepth);
  //   console.log("isPrimary: " + display.isPrimary);
  //   console.log("isInternal: " + display.isInternal);
  // }
  return displays;
}

function open_window(event) {
  const promise = clients.openWindow('https://google.com',
                                     { x:100, y:100, width:300, height:300, type:"window"});
  // event.waitUntil(promise);
}

function present_slides(event, displays) {
  // var slide_options = { x:screen.left(), y:screen.top(), width:screen.availWidth(), height:screen.availHeight()-200, type:"window"};
  // var notes_options = { x:screen.left(), y:screen.availHeight()-200, width:screen.availWidth(), height:200, type:"window"};
  var slide_options = { x:10, y:10, width:800, height:600, type:"window"};
  var notes_options = { x:10, y:600, width:800, height:200, type:"window"};
  if (displays && displays.length > 1) {
    slide_options = { x:displays[1].left, y:displays[1].top, width:displays[1].width, height:displays[1].height, type:"window"};
    notes_options = { x:displays[0].left, y:displays[0].top, width:displays[0].width, height:displays[0].height, type:"window"};
  }
  console.log("MSW slide: " + slide_options.x + "," + slide_options.y + " " + slide_options.width + "x" + slide_options.height);
  console.log("MSW notes: " + notes_options.x + "," + notes_options.y + " " + notes_options.width + "x" + notes_options.height);
  const slide_promise = clients.openWindow('https://google.com',
                                   slide_options);
  //'data:text/html;charset=utf-8,<head><title>Presentation: First Slide</title></head><body><h1>Window Placement API Demo</h1><p><p/><h2>msw@chromium.org & staphany@chromium.org</h2></body>',
  // //'data:text/html;charset=utf-8,<head><title>Presentation (Speaker Notes)</title></head><body><h3>Speaker Notes</h3><p></p>Thanks for watching our Window Placement API demo!</body>',
  //event.waitUntil(slide_promise);
  const notes_promise = clients.openWindow('https://cnn.com',
                                   notes_options);
  // // event.waitUntil(notes_promise);
}

function open_dashboard(event) {
  const presentation = clients.openWindow('data:text/html;charset=utf-8,<head><title>Presentation: First Slide</title></head><body><h1>Window Placement API Demo</h1><p><p/><h2>msw@chromium.org & staphany@chromium.org</h2></body>',
                                          { x:0, y:0, width:800, height:600, type:"window"});
}

function cautious_open_window(event) {
  try {
    console.log("MSW calling openWindow");
    const promise = clients.openWindow('https://google.com', { x:100, y:100, width:300, height:300, type:"window"});
    if (promise !== undefined) {
      promise.then(_ => {
        console.log("MSW openWindow ok");
      }).catch(error => {
        console.log("MSW openWindow fail: " + error);
      });
    } else {
      console.log("MSW openWindow fail (undefined?)");
    }
    console.log("MSW waiting for openWindow promise");
    // event.waitUntil(promise);
  } catch (error) {
    console.log("MSW caught error:" + error);
  }
}
