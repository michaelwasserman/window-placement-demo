async function getScreensWithWarningAndFallback() {
  var screens = ('getScreens' in self) ? await getScreens() : [ window.screen ];

  if (screens.length == 0) {
    document.getElementById("allow-permission").hidden = false;
    console.error("Window Placement permission denied");
    screens = [ window.screen ];
  }

  console.log("INFO: Able to detect " + screens.length + " screen(s):");
  for (const screen of screens) {
    console.log(`[${screen.id ? screen.id : "window.screen"}] ` + 
                `${screen.left},${screen.top} ${screen.width}x${screen.height} ` +
                `scaleFactor:${screen.scaleFactor}, colorDepth:${screen.colorDepth} ` +
                `primary:${screen.primary}, internal:${screen.internal},` +
                `touchSupport:${screen.touchSupport}`);
  }

  return screens;
}

async function showScreens(screens) {
  for (const screen of screens) {
    if (screen.left === undefined)
      screen.left = screen.availLeft;
    if (screen.top === undefined)
      screen.top = screen.availTop;
  }

  const canvas = document.getElementById('screens-canvas');
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);

  var scale = 1.0/10.0;
  var screen_space = { left:0, top:0, right:0, bottom:0 };
  for (const screen of screens) {
    screen_space.left = Math.min(screen_space.left, screen.left);
    screen_space.top = Math.min(screen_space.top, screen.top);
    screen_space.right = Math.max(screen_space.right, screen.left + screen.width);
    screen_space.bottom = Math.max(screen_space.bottom, screen.top + screen.height);
  }
  var origin = { left:screen_space.left, top:screen_space.top };
  scale = Math.min(canvas.getBoundingClientRect().width / (screen_space.right-screen_space.left),
                   canvas.getBoundingClientRect().height / (screen_space.bottom-screen_space.top),
                   0.5);
  const colors = [ "#FF8888", "#88FF88", "#8888FF" ];
  for (i = 0; i < screens.length; ++i) {
    const screen = screens[i];
    const rect = { left:(screen.left-origin.left)*scale, top:(screen.top-origin.top)*scale, width:screen.width*scale, height:screen.height*scale };
    context.fillStyle = colors[i%colors.length];
    context.fillRect(rect.left, rect.top, rect.width, rect.height);
    context.fillStyle = "#000000";
    context.font = "15px Arial";
    context.fillText(`[${screen.id ? screen.id : 'window.screen'}] ${screen.left},${screen.top} ${screen.width}x${screen.height} ${screen.primary ? '(Primary)': ''}`, rect.left+10, rect.top+20);
    context.fillText(`scaleFactor:${screen.scaleFactor}, colorDepth:${screen.colorDepth}`, rect.left+10, rect.top+40);
    context.fillText(`primary:${screen.primary}, internal:${screen.internal}`, rect.left+10, rect.top+60);
  }
}

async function updateScreens() {
  const screens = await getScreensWithWarningAndFallback();
  showScreens(screens);

  if ('onscreenschange' in window && !window.onscreenschange)
    window.addEventListener('screenschange', updateScreens);

  let buttons = `<button onclick="fullscreenSlide()">Current Screen</button>` +
                `<button onclick="updateScreens()">Get Screens</button>`;
  for (s of screens)
    buttons += s == window.screen ? `` : `<button onclick="fullscreenSlide(${s.id})"> Screen ${s.id}</button>`;
  document.getElementById("fullscreen-slide-dropdown").innerHTML = buttons;

  return screens;
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
  };
  // TODO: Support openWindow(options) if available.
  window.open(url, '_blank', getFeaturesFromOptions(options));
}

// TODO: Add some worthwhile multi-window opening example?
// async function openWindows() {
//   var count = document.getElementById('open-windows-count').value;
//   const screens = await updateScreens();
//   const per_screen = Math.ceil(count / screens.length);
//   console.log(`MSW: openWindows count:${count}, screens:${screens.length}, per_screen:${per_screen}`);
//   for (const s of screens) {
//     const cols = Math.ceil(Math.sqrt(per_screen));
//     const rows = Math.ceil(per_screen / cols);
//     for (r = 0; r < rows; ++r) {
//       for (c = 0; c < cols && count-- > 0; ++c) {
//         const options = {
//           x: s.availLeft + s.availWidth * c / cols,
//           y: s.availTop + s.availHeight * r / rows,
//           width: s.availWidth / cols,
//           height: s.availHeight / rows,
//         };
//         const url = `data:text/html;charset=utf-8,<title>row:${r} col:${c}</title><h1>row:${r} col:${c}</h1>`;
//         console.log(`INFO: opening window row:${r} col:${c}, (${options.x},${options.y} ${options.width}x${options.height}`);
//         window.open(url, '_blank', getFeaturesFromOptions(options));
//       }
//     }
//   }
// }

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
  const screens = await updateScreens();
  var options = { x:screen.availLeft, y:screen.availTop,
                  width:screen.availWidth, height:screen.availHeight/2 };
  if (screens && screens.length > 1) {
    options = { x:screens[1].availLeft, y:screens[1].availTop,
                width:screens[1].availWidth, height:screens[1].availHeight };
  }
  const features = getFeaturesFromOptions(options);
  // TODO: Re-enable and use the fullscreen feature string option?
  console.log('INFO: Opening window with feature string: ' + features);
  const slide_window = window.open('./slide.html', '_blank', features);
  // TODO: Make the window fullscreen; this doesn't currently work:
  slide_window.document.body.requestFullscreen();
  // TODO: Open another window or reposition the current window.
  // window.open('./notes.html', '_blank', getFeaturesFromOptions(options));
}

async function openNotesWindow() {
  const screens = await updateScreens();
  var options = { x:screen.availLeft, y:screen.availTop+screen.availHeight/2,
                  width:screen.availWidth, height:screen.availHeight/2 };
  if (screens && screens.length > 1) {
    options = { x:screens[0].availLeft, y:screens[0].availTop,
                width:screens[0].availWidth, height:screens[0].availHeight };
  }
  const features = getFeaturesFromOptions(options);
  // TODO: Re-enable and use the fullscreen feature string option?
  console.log('INFO: Opening window with feature string: ' + features);
  const notes_window = window.open('./notes.html', '_blank', features);
  // TODO: Make the window fullscreen; this doesn't currently work:
  notes_window.document.body.requestFullscreen();
  // TODO: Open another window or reposition the current window.
  // window.open('./slides.html', '_blank', getFeaturesFromOptions(options));
}

async function openSlideAndNotesWindows() {
  openSlideWindow();
  openNotesWindow();
}

async function fullscreenSlide(screenId) {
  if (!screenId) {
    // TODO: Choose another screen?
    // (s.left != window.screen.left || s.top != window.screen.top)
    document.getElementById('slide').requestFullscreen(); 
    return;
  }

  let fullscreenOptions = { navigationUI: "auto" };
  const screens = await updateScreens();
  if (screens && screens.length > 1) {
    console.log('Info: Requesting fullscreen on another screen.');
    for (const s of screens) {
      if (screenId == s.id) {
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
  // document.getElementById("open-windows").addEventListener('click', openWindows);
  document.getElementById("update-screens").addEventListener('click', updateScreens);
  document.getElementById("show-notification").addEventListener('click', showNotification);
  document.getElementById("toggle-fullscreen").addEventListener('click', toggleFullscreen);
  document.getElementById("open-slide-window").addEventListener('click', openSlideWindow);
  document.getElementById("open-notes-window").addEventListener('click', openNotesWindow);
  document.getElementById("open-slide-and-notes-windows").addEventListener('click', openSlideAndNotesWindows);
  document.getElementById("fullscreen-slide").addEventListener('click', () => { fullscreenSlide(null) });
  document.getElementById("fullscreen-on-current-screen").addEventListener('click', () => { fullscreenSlide(null) });
  document.getElementById("get-screens").addEventListener('click', updateScreens);

  // TODO: Consider requesting permission for getScreens on load?
  showScreens([window.screen]);
}