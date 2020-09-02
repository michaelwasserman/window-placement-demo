'use strict';

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
  if (!('getScreens' in self)) {
    showWarning("Please use Chrome 86+ to demo new multi-screen features");
  } else if ('isMultiScreen' in self && !(await isMultiScreen())) {
    // TODO: Update this warning with screenschange events.
    showWarning("Please use multiple screens for full demo functionality");
  } else {
    let permission = await navigator.permissions.query({name:'window-placement'});
    permission.addEventListener('change', () => { updateScreens(/*requestPermission=*/false); });
  }
  if ('onscreenschange' in self)
    addEventListener('screenschange', () => { updateScreens(/*requestPermission=*/false); });
  updateScreens(/*requestPermission=*/false);
});

async function getScreensWithWarningAndFallback(requestPermission) {
  let screens = [ window.screen ];
  if ('getScreens' in self) {
    let permission = await navigator.permissions.query({name:'window-placement'});
    if (permission.state === 'granted' || (permission.state === 'prompt' && requestPermission))
      screens = (await getScreens().catch(()=>{})) || [ window.screen ];
    if (screens.length >= 1 && screens[0] !== window.screen)
      showWarning();  // Clear any warning.
    else if (requestPermission || permission.state === 'denied')
      showWarning("Please allow the Window Placement permission for full demo functionality");
  }

  console.log("INFO: Able to detect " + screens.length + " screen(s):");
  for (const screen of screens) {
    console.log(`[${screen.id ? screen.id : "window.screen"}] ` + 
                `(${screen.left},${screen.top} ${screen.width}x${screen.height}) ` +
                `scaleFactor:${screen.scaleFactor} colorDepth:${screen.colorDepth} ` +
                `primary:${screen.primary} internal:${screen.internal} ` +
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
    context.fillText(`[${screen.id ? screen.id : 'window.screen'}] ${screen.left},${screen.top} ${screen.width}x${screen.height} ${screen.primary ? '(Primary)': ''}`, rect.left+10, rect.top+20);
    context.fillText(`scaleFactor:${screen.scaleFactor}, colorDepth:${screen.colorDepth}`, rect.left+10, rect.top+40);
    context.fillText(`primary:${screen.primary}, internal:${screen.internal}`, rect.left+10, rect.top+60);
  }

  const rect = { left:(window.screenLeft-origin.left)*scale, top:(window.screenTop-origin.top)*scale, width:window.outerWidth*scale, height:window.outerHeight*scale };
  context.strokeRect(rect.left, rect.top, rect.width, rect.height);
  context.fillText(`window ${window.screenLeft},${window.screenTop} ${window.outerWidth}x${window.outerHeight}`, rect.left+10, rect.top+rect.height-10);
}

async function updateScreens(requestPermission = true) {
  const screens = await getScreensWithWarningAndFallback(requestPermission);
  showScreens(screens);

  if (document.getElementById("fullscreen-slide-dropdown")) {
    let buttons = `<button onclick="fullscreenSlide()">Current Screen</button>` +
                  `<button onclick="updateScreens()">Get Screens</button>`;
    for (let s of screens)
      buttons += s == window.screen ? `` : `<button onclick="fullscreenSlide(${s.id})"> Screen ${s.id}</button>`;
    document.getElementById("fullscreen-slide-dropdown").innerHTML = buttons;
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

async function toggleFullscreen() {
  if (document.fullscreenElement)
    document.exitFullscreen();
  else
    document.getElementById('application').requestFullscreen();
}

async function openSlideWindow() {
  const screens = await updateScreens(/*requestPermission=*/false);
  let options = { x:screen.availLeft, y:screen.availTop,
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
  // slide_window.document.body.requestFullscreen();
  // TODO: Open another window or reposition the current window.
  // window.open('./notes.html', '_blank', getFeaturesFromOptions(options));
}

async function openNotesWindow() {
  const screens = await updateScreens(/*requestPermission=*/false);
  let options = { x:screen.availLeft, y:screen.availTop+screen.availHeight/2,
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
  // notes_window.document.body.requestFullscreen();
  // TODO: Open another window or reposition the current window.
  // window.open('./slide.html', '_blank', getFeaturesFromOptions(options));
}

async function openSlideAndNotesWindows() {
  openSlideWindow();
  openNotesWindow();
}

async function fullscreenSlide(screenId) {
  if (screenId == undefined) {
    // TODO: Choose another screen?
    // (s.left != window.screen.left || s.top != window.screen.top)
    document.getElementById('slide').requestFullscreen(); 
    return;
  }

  let fullscreenOptions = { navigationUI: "auto" };
  const screens = await updateScreens(/*requestPermission=*/false);
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
