'use strict';

let permissionStatus = null;
let screensInterface = null;

function showWarning(text) {
  let warning = document.getElementById("warning");
  if (warning) {
    warning.hidden = !text;
    warning.innerText = text;
  }
  if (text)
    console.error(text);
}

window.addEventListener('load', async () => {
  if (!('getScreens' in self) || !('isExtended' in screen) || !('onchange' in screen)) {
    showWarning("Please use Chrome 93+ to demo new multi-screen features");
  } else {
    screen.addEventListener('change', () => { updateScreens(/*requestPermission=*/false); });
    permissionStatus = await navigator.permissions.query({name:'window-placement'});
    permissionStatus.addEventListener('change', (p) => { permissionStatus = p; updateScreens(/*requestPermission=*/false); });
  }
  updateScreens(/*requestPermission=*/false);
});

function setScreenListeners() {
  let screens = screensInterface ? screensInterface.screens : [ window.screen ];
  for (const s of screens)
    s.onchange = () => { updateScreens(/*requestPermission=*/false); };
}

async function getScreensWithWarningAndFallback(requestPermission) {
  if ('getScreens' in self) {
    if (!screensInterface && (permissionStatus.state === 'granted' ||
                              (permissionStatus.state === 'prompt' && requestPermission))) {
      screensInterface = await getScreens().catch((e)=>{ console.error(e); return null; });
      if (screensInterface) {
        screensInterface.addEventListener('screenschange', () => { updateScreens(/*requestPermission=*/false); setScreenListeners(); });
        setScreenListeners();
      }
    }
    if (screensInterface && screensInterface.screens.length > 1)
      showWarning();  // Clear any warning.
    else if (screensInterface && screensInterface.screens.length == 1)
      showWarning("Please extend your desktop over multiple screens for full demo functionality");
    else if (requestPermission || permissionStatus.state === 'denied')
      showWarning("Please allow the Window Placement permission for full demo functionality");

    if (screensInterface) {
      // console.log("INFO: Detected " + screensInterface.screens.length + " screens:");
      // for (let i = 0; i < screensInterface.screens.length; ++i) {
      //   const s = screensInterface.screens[i];
      //   console.log(`[${i}] (${s.left},${s.top} ${s.width}x${s.height}) isExtended:${s.isExtended}` +
      //               `isPrimary:${s.isPrimary} isInternal:${s.isInternal}`);
      // }
      return screensInterface.screens;
    }
  }

  // console.log(`INFO: Detected window.screen: (${screen.left},${screen.top} ${screen.width}x${screen.height}) isExtended:${screen.isExtended}`);
  return [ window.screen ];
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

  let scale = 1.0/10.0;
  let screen_space = { left:0, top:0, right:0, bottom:0 };
  for (const screen of screens) {
    screen_space.left = Math.min(screen_space.left, screen.left);
    screen_space.top = Math.min(screen_space.top, screen.top);
    screen_space.right = Math.max(screen_space.right, screen.left + screen.width);
    screen_space.bottom = Math.max(screen_space.bottom, screen.top + screen.height);
  }
  let origin = { left:screen_space.left, top:screen_space.top };
  scale = Math.min(canvas.getBoundingClientRect().width / (screen_space.right-screen_space.left),
                   canvas.getBoundingClientRect().height / (screen_space.bottom-screen_space.top),
                   0.5);
  const colors = [ "#FF8888", "#88FF88", "#8888FF" ];
  for (let i = 0; i < screens.length; ++i) {
    const screen = screens[i];
    const rect = { left:(screen.left-origin.left)*scale, top:(screen.top-origin.top)*scale, width:screen.width*scale, height:screen.height*scale };
    context.fillStyle = colors[i%colors.length];
    context.fillRect(rect.left, rect.top, rect.width, rect.height);
    context.fillStyle = "#000000";
    context.font = "15px Arial";
    context.fillText(`[${screen == window.screen ? 'window.screen' : i}] ${screen.left},${screen.top} ${screen.width}x${screen.height} ${screen.isPrimary ? '(Primary)': ''}`, rect.left+10, rect.top+20);
    context.fillText(`scaleFactor:${screen.scaleFactor}, colorDepth:${screen.colorDepth}`, rect.left+10, rect.top+40);
    if (screen == window.screen)
      context.fillText(`isExtended:${screen.isExtended}`, rect.left+10, rect.top+60);
    else
      context.fillText(`isExtended:${screen.isExtended} isPrimary:${screen.isPrimary} isInternal:${screen.isInternal}`, rect.left+10, rect.top+60);
  }

  const rect = { left:(window.screenLeft-origin.left)*scale, top:(window.screenTop-origin.top)*scale, width:window.outerWidth*scale, height:window.outerHeight*scale };
  context.strokeRect(rect.left, rect.top, rect.width, rect.height);
  context.fillText(`window ${window.screenLeft},${window.screenTop} ${window.outerWidth}x${window.outerHeight}`, rect.left+10, rect.top+rect.height-10);
}

async function updateScreens(requestPermission = true) {
  const screens = await getScreensWithWarningAndFallback(requestPermission);
  showScreens(screens);

  if (document.getElementById("toggle-fullscreen-dropdown")) {
    let buttons = `<button onclick="toggleFullscreen()">Current Screen</button>` +
                  `<button onclick="updateScreens()">Get Screens</button>`;
    // TODO(msw): Use screen.id and not indices.
    for (let i = 0; i < screens.length; ++i)
      buttons += screens[i] == window.screen ? `` : `<button onclick="toggleFullscreen(${i})"> Screen ${i}</button>`;
    document.getElementById("toggle-fullscreen-dropdown").innerHTML = buttons;
  }
  if (document.getElementById("fullscreen-slide-dropdown")) {
    let buttons = `<button onclick="fullscreenSlide()">Current Screen</button>` +
                  `<button onclick="updateScreens()">Get Screens</button>`;
    // TODO(msw): Use screen.id and not indices.
    for (let i = 0; i < screens.length; ++i)
      buttons += screens[i] == window.screen ? `` : `<button onclick="fullscreenSlide(${i})"> Screen ${i}</button>`;
    document.getElementById("fullscreen-slide-dropdown").innerHTML = buttons;
  }
  if (document.getElementById("fullscreen-slide-and-open-notes-window-dropdown")) {
    let buttons = `<button onclick="fullscreenSlideAndOpenNotesWindow()">Current Screen</button>` +
                  `<button onclick="updateScreens()">Get Screens</button>`;
    // TODO(msw): Use screen.id and not indices.
    for (let i = 0; i < screens.length; ++i)
      buttons += screens[i] == window.screen ? `` : `<button onclick="fullscreenSlideAndOpenNotesWindow(${i})"> Screen ${i}</button>`;
    document.getElementById("fullscreen-slide-and-open-notes-window-dropdown").innerHTML = buttons;
  }
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
//   let count = document.getElementById('open-windows-count').value;
//   const screens = await updateScreens(/*requestPermission=*/false);
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

// function showNotification() {
//   Notification.requestPermission(function(result) {
//     if (result !== 'denied') { // result: 'allowed' / 'denied' / 'default'
//       navigator.serviceWorker.ready.then(function(registration) {
//         // Show notification; user clicks trigger "notificationclick".
//         registration.showNotification('Click to open a window!');
//       });
//     }
//   });
// }

async function toggleElementFullscreen(element, screenId) {
  if (typeof(screenId) != "number") {  // Ignore EventListener's event args.
    if (document.fullscreenElement == element)
      document.exitFullscreen();
    else
      element.requestFullscreen();
    return;
  }

  let fullscreenOptions = { navigationUI: "auto" };
  const screens = await updateScreens(/*requestPermission=*/false);
  if (screens.length > 1 && screenId < screens.length) {
    console.log('Info: Requesting fullscreen on another screen.');
    // TODO(msw): Use screen.id and not an index.
    fullscreenOptions.screen = screens[screenId];
  }
  element.requestFullscreen(fullscreenOptions);
}

async function toggleFullscreen(screenId) {
  toggleElementFullscreen(document.getElementById('application'), screenId);
}

async function openSlideWindow(screenId) {
  const screens = await updateScreens(/*requestPermission=*/false);
  let options = { x:screen.availLeft, y:screen.availTop,
                  width:screen.availWidth, height:screen.availHeight/2 };
  if (screens && screens.length > 1) {
    let screen = screens[1];
    if (typeof(screenId) == "number" && screenId >= 0 && screenId < screens.length)
      screen = screens[screenId];
    options = { x:screen.availLeft, y:screen.availTop,
                width:screen.availWidth, height:screen.availHeight };
  }
  const features = getFeaturesFromOptions(options);
  // TODO: Re-enable and use the fullscreen feature string option?
  console.log('INFO: Opening window with feature string: ' + features);
  const slide_window = window.open('./slide.html', '_blank', features);
  // TODO: Make the window fullscreen; this doesn't currently work:
  // slide_window.document.body.requestFullscreen();
  // TODO: Open another window or reposition the current window.
  // window.open('./notes.html', '_blank', getFeaturesFromOptions(options));
  return slide_window;
}

async function openNotesWindow(screenId) {
  const screens = await updateScreens(/*requestPermission=*/false);
  let options = { x:screen.availLeft, y:screen.availTop+screen.availHeight/2,
                  width:screen.availWidth, height:screen.availHeight/2 };
  if (screens && screens.length > 1) {
    let screen = screens[0];
    if (typeof(screenId) == "number" && screenId >= 0 && screenId < screens.length)
      screen = screens[screenId];
    options = { x:screen.availLeft, y:screen.availTop,
                width:screen.availWidth, height:screen.availHeight };
  }
  const features = getFeaturesFromOptions(options);
  // TODO: Re-enable and use the fullscreen feature string option?
  console.log('INFO: Opening window with feature string: ' + features);
  const notes_window = window.open('./notes.html', '_blank', features);
  // TODO: Make the window fullscreen; this doesn't currently work:
  // notes_window.document.body.requestFullscreen();
  // TODO: Open another window or reposition the current window.
  // window.open('./slide.html', '_blank', getFeaturesFromOptions(options));
  return notes_window;
}

async function openSlideAndNotesWindows() {
  openSlideWindow();
  openNotesWindow();
}

async function fullscreenSlide(screenId) {
  toggleElementFullscreen(document.getElementById('slide'), screenId);
}

async function fullscreenSlideAndOpenNotesWindow(screenId) {
  if (typeof(screenId) != "number")
    screenId = 0;
  fullscreenSlide(screenId);
  openNotesWindow(screenId == 0 ? 1 : 0);
}