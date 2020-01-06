async function showScreens() {
  const screens = await self.getScreens();
  console.log("INFO: getScreens returned " + screens.length + " screens:");
  for (const screen of screens) {
    console.log(`'${screen.name}' ${screen.left},${screen.top} ${screen.width}x${screen.height} ` +
                `scaleFactor:${screen.scaleFactor}, colorDepth:${screen.colorDepth} ` +
                `primary:${screen.primary}, internal:${screen.internal}`);
  }

  var canvas = document.getElementById('screens-canvas');
  var context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);

  var scale = 1.0/10.0;
  var screen_space = { left:0, top:0, right:0, bottom:0 };
  for (const screen of screens) {
    screen_space.left = Math.min(screen_space.left, screen.left);
    screen_space.top = Math.min(screen_space.top, screen.top);
    screen_space.right = Math.max(screen_space.right, screen.left + screen.width);
    screen_space.bottom = Math.max(screen_space.bottom, screen.top + screen.height);
  }
  scale = Math.min(canvas.getBoundingClientRect().width / (screen_space.right-screen_space.left),
                    canvas.getBoundingClientRect().height / (screen_space.bottom-screen_space.top));

  var colors = [ "#FF8888", "#88FF88", "#8888FF" ];
  for (i = 0; i < screens.length; ++i) {
    var screen = screens[i];
    // console.log(`[${i}] '${screen.name}' ${screen.left},${screen.top} ${screen.width}x${screen.height} ${screen.primary ? '(Primary)': ''}`);
    // console.log(`scaleFactor:${screen.scaleFactor}, colorDepth:${screen.colorDepth} primary:${screen.primary}, internal:${screen.internal}`);
    context.fillStyle = colors[i%colors.length];
    context.fillRect(screen.left*scale, screen.top*scale, screen.width*scale, screen.height*scale);
    context.fillStyle = "#000000";
    context.font = "15px Arial";
    context.fillText(`[${i}] ${screen.left},${screen.top} ${screen.width}x${screen.height} ${screen.primary ? '(Primary)': ''}`, screen.left*scale+10, screen.top*scale+20);
    context.fillText(`scaleFactor:${screen.scaleFactor}, colorDepth:${screen.colorDepth}`, screen.left*scale+10, screen.top*scale+40);
    context.fillText(`primary:${screen.primary}, internal:${screen.internal}`, screen.left*scale+10, screen.top*scale+60);
  }
}

function getFeaturesFromOptions(options) {
  return "left=" + options.x + ",top=" + options.y +
         ",width=" + options.width + ",height=" + options.height;
}

function openWindow() {
  var url = document.getElementById('open-window-url').value;
  var options = {
    x: document.getElementById('open-window-left').value,
    y: document.getElementById('open-window-top').value,
    width: document.getElementById('open-window-width').value,
    height: document.getElementById('open-window-height').value,
    type: "window"
  };
  window.open(url, '_blank', getFeaturesFromOptions(options));
  // TODO: Support Service Worker's clients.openWindow options onces that lands.
  // navigator.serviceWorker.controller.postMessage({sender:"open-window-button", url:url, options:options});
}

function showNotification() {
  Notification.requestPermission(function(result) {
    if (result !== 'denied') { // result: 'allowed' / 'denied' / 'default'
      navigator.serviceWorker.ready.then(function(registration) {
        // Show notification; user clicks trigger "notificationclick".
        registration.showNotification('Click to open a window!');
      });
    }
  });
}

async function toggleFullscreen() {
  if (document.fullscreenElement)
    document.exitFullscreen();
  else
    document.getElementById('application').requestFullscreen();
}

async function openSlideWindow() {
  const screens = await self.getScreens();
  var slide_options = { x:0, y:0, width:800, height:600, type:"window"};
  var notes_options = { x:0, y:600, width:800, height:200, type:"window"};
  if (screens && screens.length > 1) {
    slide_options = { x:screens[1].left, y:screens[1].top, width:screens[1].width, height:screens[1].height, type:"window"};
    notes_options = { x:screens[0].left, y:screens[0].top, width:screens[0].width, height:screens[0].height, type:"window"};
  }
  var features = getFeaturesFromOptions(slide_options)
  // TODO: Re-enable and use the fullscreen feature string option?
  console.log('INFO: Opening window with feature string: ' + features);
  var slideshow = window.open('./slide.html', '_blank', features);
  // TODO: Make the slide window fullscreen; this doesn't seem to work:
  slideshow.document.body.requestFullscreen();
  // TODO: Open a notes window or reposition the current window.
  // window.open('./notes.html', '_blank', getFeaturesFromOptions(options));
  // TODO: Support Service Worker's clients.openWindow options onces that lands.
  // navigator.serviceWorker.controller.postMessage({sender:"open-slide-window-button"});
}

async function fullscreenSlide() {
  let fullscreenOptions = { navigationUI: "auto" };
  const screens = await self.getScreens();
  if (screens && screens.length > 1) {
    console.log('Info: Requesting fullscreen on opposite screen.');
    for (s of screens) {
      if (s.left > window.screenLeft + window.outerWidth || 
          s.left + s.width < window.screenLeft || 
          s.top > window.screenTop + window.outerHeight ||
          s.top + s.height < window.screenTop) {
        fullscreenOptions.screen = s;
        break;
      }
    }
    if (!fullscreenOptions.screen)
      fullscreenOptions.screen = screens[0];
  }
  document.getElementById('slide').requestFullscreen(fullscreenOptions);
}

window.onload = () => {
  'use strict';

  if ('serviceWorker' in navigator)
    navigator.serviceWorker.register('./sw.js');

  // Handle control button clicks and input events.
  document.getElementById("open-window").addEventListener('click', openWindow);
  document.getElementById("show-screens").addEventListener('click', showScreens);
  document.getElementById("show-notification").addEventListener('click', showNotification);
  document.getElementById("toggle-fullscreen").addEventListener('click', toggleFullscreen);
  document.getElementById("open-slide-window").addEventListener('click', openSlideWindow);
  document.getElementById("fullscreen-slide").addEventListener('click', fullscreenSlide);

  showScreens();
}