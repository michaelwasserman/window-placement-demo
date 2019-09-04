self.addEventListener('install', event => {
  console.log("MSW service worker install");
});

self.addEventListener('activate', event => {
  console.log("MSW service worker activate");
});

self.addEventListener('message', function(event){
  console.log("MSW service worker message: " + event.data);
  // TODO(msw): event.waitUntil?
  displays = getDisplays().then(async function(displays) {
    if (event.data.sender === "show-displays-button") {
      // console.log("MSW posting message to client...");
      event.ports[0].postMessage(displays);
    } else if (event.data.sender === "open-window-button") {
      open_window(event);
    } else if (event.data.sender === "present-slide-button") {
      present_slide(event, displays);
    }
  })
});

self.addEventListener('notificationclick', function(event) {
  console.log("MSW service worker notificationclick");
  event.notification.close();
  open_window(event);
});

async function getDisplays() {
  // console.log("MSW getDisplays");
  const displays = await navigator.screen.requestDisplays();
  // console.log("MSW displays: " + displays.length);
  // for (const display of displays) {
  //   console.log(`[${i}] '${display.name}' ${display.left},${display.top} ${display.width}x${display.height} ${display.isPrimary ? '(Primary)': ''}`);
  //   console.log(`scaleFactor:${display.scaleFactor}, colorDepth:${display.colorDepth} isPrimary:${display.isPrimary}, isInternal:${display.isInternal}`);
  // }
  return displays;
}

function open_window(event) {
  var url = 'https:wikipedia.org'
  var options = { x:50, y:100, width:400, height:200, type:"window"}
  if (event && event.data && event.data.url.length != 0)
    url = event.data.url;
  if (event && event.data && event.data.options)
    options = event.data.options;
  console.log("MSW Calling openWindow(" + url + "," + JSON.stringify(options) + ")");
  const promise = clients.openWindow(url, options);
  // event.waitUntil(promise);
}

function present_slide(event, displays) {
  // var slide_options = { x:screen.left(), y:screen.top(), width:screen.availWidth(), height:screen.availHeight()-200, type:"window"};
  // var notes_options = { x:screen.left(), y:screen.availHeight()-200, width:screen.availWidth(), height:200, type:"window"};
  var slide_options = { x:10, y:10, width:800, height:600, type:"window"};
  var notes_options = { x:10, y:600, width:800, height:200, type:"window"};
  if (displays && displays.length > 1) {
    slide_options = { x:displays[1].left, y:displays[1].top, width:displays[1].width, height:displays[1].height, type:"window"};
    notes_options = { x:displays[0].left, y:displays[0].top, width:displays[0].width, height:displays[0].height, type:"window"};
  }
  // console.log("MSW slide: " + slide_options.x + "," + slide_options.y + " " + slide_options.width + "x" + slide_options.height);
  // console.log("MSW notes: " + notes_options.x + "," + notes_options.y + " " + notes_options.width + "x" + notes_options.height);
  const slide_promise = clients.openWindow('slide.html', slide_options);
  // event.waitUntil(slide_promise);
  // TODO(msw): opening another window clobbers the first... 
  // const notes_promise = clients.openWindow('https://cnn.com', notes_options);
  // event.waitUntil(notes_promise);
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
