async function getScreensWithWarningAndFallback() {
  var screens = ('getScreens' in self) ? await getScreens() : [ window.screen ];
  if (screens.length == 0) {
    document.getElementById("allow-permission").hidden = false;
    console.error("Window Placement permission denied");
    screens = [ window.screen ];
  }
  return screens;
}

async function showScreens() {
  const screens = await getScreensWithWarningAndFallback();
  console.log("INFO: Able to detect " + screens.length + " screens:");
  for (const screen of screens) {
    if (screen.left === undefined)
      screen.left = screen.availLeft;
    if (screen.top === undefined)
      screen.top = screen.availTop;
    console.log(`'${screen.id}' ${screen.left},${screen.top} ${screen.width}x${screen.height} ` +
                `scaleFactor:${screen.scaleFactor}, colorDepth:${screen.colorDepth} ` +
                `primary:${screen.primary}, internal:${screen.internal},` +
                `touchSupport:${screen.touchSupport}`);
  }

  const canvas = document.getElementById('screens-canvas');
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);

  var scale = 1.0/10.0;
  var screen_space = { left:0, top:0, right:0, bottom:0 };
  var origin = { left:screens[0].left, top:screens[0].top };
  for (const screen of screens) {
    screen_space.left = Math.min(screen_space.left, screen.left);
    screen_space.top = Math.min(screen_space.top, screen.top);
    screen_space.right = Math.max(screen_space.right, screen.left + screen.width);
    screen_space.bottom = Math.max(screen_space.bottom, screen.top + screen.height);
    origin.left = Math.min(origin.left, screen.left);
    origin.top = Math.min(origin.top, screen.top);
  }
  scale = Math.min(canvas.getBoundingClientRect().width / (screen_space.right-screen_space.left),
                   canvas.getBoundingClientRect().height / (screen_space.bottom-screen_space.top));

  const colors = [ "#FF8888", "#88FF88", "#8888FF" ];
  for (i = 0; i < screens.length; ++i) {
    const screen = screens[i];
    const rect = { left:(screen.left-origin.left)*scale, top:(screen.top-origin.top)*scale, width:screen.width*scale, height:screen.height*scale };
    context.fillStyle = colors[i%colors.length];
    context.fillRect(rect.left, rect.top, rect.width, rect.height);
    context.fillStyle = "#000000";
    context.font = "15px Arial";
    context.fillText(`[${screen.id}] ${screen.left},${screen.top} ${screen.width}x${screen.height} ${screen.primary ? '(Primary)': ''}`, rect.left+10, rect.top+20);
    context.fillText(`scaleFactor:${screen.scaleFactor}, colorDepth:${screen.colorDepth}`, rect.left+10, rect.top+40);
    context.fillText(`primary:${screen.primary}, internal:${screen.internal}`, rect.left+10, rect.top+60);
  }
}

function getFeaturesFromOptions(options) {
  return "left=" + options.x + ",top=" + options.y +
         ",width=" + options.width + ",height=" + options.height;
}

function openWindow() {
  const url = document.getElementById('open-window-url').value;
  const options = {
    x: document.getElementById('open-window-left').value,
    y: document.getElementById('open-window-top').value,
    width: document.getElementById('open-window-width').value,
    height: document.getElementById('open-window-height').value,
    type: "window"
  };
  // TODO: Support openWindow(options) if available.
  window.open(url, '_blank', getFeaturesFromOptions(options));
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
  const screens = await getScreensWithWarningAndFallback();
  var slide_options = { x:0, y:0, width:800, height:600 };
  var notes_options = { x:0, y:600, width:800, height:200 };
  if (screens && screens.length > 1) {
    slide_options = { x:screens[1].availLeft, y:screens[1].availTop,
                      width:screens[1].availWidth, height:screens[1].availHeight };
    notes_options = { x:screens[0].availLeft, y:screens[0].availTop,
                      width:screens[0].availWidth, height:screens[0].availHeight };
  }
  const features = getFeaturesFromOptions(slide_options)
  // TODO: Re-enable and use the fullscreen feature string option?
  console.log('INFO: Opening window with feature string: ' + features);
  const slideshow = window.open('./slide.html', '_blank', features);
  // TODO: Make the slide window fullscreen; this doesn't currently work:
  slideshow.document.body.requestFullscreen();
  // TODO: Open a notes window or reposition the current window.
  // window.open('./notes.html', '_blank', getFeaturesFromOptions(options));
}

async function fullscreenSlide() {
  const screens = await getScreensWithWarningAndFallback();
  let fullscreenOptions = { navigationUI: "auto" };
  if (screens && screens.length > 1) {
    console.log('Info: Requesting fullscreen on another screen.');
    for (s of screens) {
      if (s.left != window.screen.left || s.top != window.screen.top) {
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

  if (!('getScreens' in self)) {
    document.getElementById("enable-features").hidden = false;
    console.error("chrome://flags#enable-experimental-web-platform-features");
  }

  // Handle control button clicks and input events.
  document.getElementById("open-window").addEventListener('click', openWindow);
  // document.getElementById("show-screens").addEventListener('click', showScreens);
  document.getElementById("show-notification").addEventListener('click', showNotification);
  document.getElementById("toggle-fullscreen").addEventListener('click', toggleFullscreen);
  document.getElementById("open-slide-window").addEventListener('click', openSlideWindow);
  document.getElementById("fullscreen-slide").addEventListener('click', fullscreenSlide);

  if ('onscreenschange' in window)
    window.addEventListener('screenschange', showScreens);

  showScreens();
}