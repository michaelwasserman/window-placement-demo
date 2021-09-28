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
  toggleElementFullscreen(document.documentElement, screenId);
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
  // if (typeof(screenId) != "number")
  //   screenId = 0;
  // fullscreenSlide(screenId);
  // openNotesWindow(screenId == 0 ? 1 : 0);

  // MSW: Mostly tested on Linux and Chrome OS, Windows and Mac may differ.
  if (!screensInterface)
    screensInterface = await window.getScreens();

  let s0 = screensInterface.screens[0];
  let s1 = screensInterface.screens[1];
  let popunderBounds = 'left='+(screenX+10)+',top='+(screenY+10)+',width='+outerWidth/2+',height='+outerHeight/2;
  let availBounds = s => 'left='+s.availLeft+',top='+s.availTop+',width='+s.availWidth+',height='+s.availHeight;

  // // 1: With proposed TransientAllowPopup Window Placement affordances (2C), sites can:
  // //   a: request fullscreen on the opener (consuming user activation [and activating transient affordance]), and
  // //   b: open a popup (without a user activation requirement, via Popups & Redirects or transient affordance)
  // document.body.requestFullscreen({screen:s1});
  // const popup = window.open('.', '', availBounds(s0));

  // // Abuse 1A: [Esc] does not exit fullscreen until that window is activated.
  // // Effective? YES. The popup is activated and receives input by default.
  // document.body.requestFullscreen({screen:s1});
  // const popup = window.open('.', '', availBounds(s1));

  // // Abuse 1B: Fullscreen popunder - Place fullscreen over popup with [delayed] swap.
  // // Effective? YES. Fullscreen is activated and brought front on swap, after crrev.com/c/3108413
  // // NOTE: crbug.com/1241233 mitigated obscuring the fullscreen window or the inactive active popup.
  // document.body.requestFullscreen({screen:s1});
  // const popup = window.open('.', '', availBounds(s0));
  // setTimeout(() => { document.body.requestFullscreen({screen:s0}); }, 3000);

  // // Abuse 1C: Popunder - Exit fullscreen after opening the popup (also possible with two popups).
  // // Effective? YES. Site must swap displays before exit to activate the opener (see crbug.com/1218483 and crbug.com/1241233).
  // document.body.requestFullscreen({screen:s1});
  // const popup = window.open('.', '', popunderBounds);
  // setTimeout(() => { document.body.requestFullscreen({screen:s0}); }, 1000);
  // setTimeout(() => { document.exitFullscreen(); }, 2000);

  // // Abuse 1D: Unexpected fullscreen + popup "swap". (also possible with two popups).
  // // Effective? YES. Site can swap fullscreen and popup without any interaction.
  // document.body.requestFullscreen({screen:s1});
  // const popup = window.open('.', '', availBounds(s0));
  // setTimeout(() => { document.body.requestFullscreen({screen:s0}); }, 2000);
  // setTimeout(() => { popup.moveTo(s1.availLeft, s1.availTop); }, 2500);

  // // Abuse 1E: Open popup over fullscreen.
  // // Effective? NO. Fullscreen exits per ForSecurityDropFullscreen on open.
  // document.body.requestFullscreen({screen:s1});
  // const popup = window.open('.', '', availBounds(s1));

  // // Abuse 1F: Move popup over fullscreen.
  // // Effective? NO. Fullscreen exits per ForSecurityDropFullscreen on move.
  // document.body.requestFullscreen({screen:s1});
  // const popup = window.open('.', '', availBounds(s0));
  // setTimeout(() => { popup.moveTo(s1.availLeft, s1.availTop); }, 2000);


  // // 2: With proposed TransientAllowFullscreen Window Placement affordances (2A), sites can:
  // //   a: open a popup (consuming user activation and activating TransientAllowFullscreen)
  // //   b: request fullscreen on the opener (using its TransientAllowFullscreen affordance)
  // const popup = window.open('.', '', availBounds(s0));
  // document.body.requestFullscreen({screen:s0});

  // // Abuse 2A: Fullscreen pop-under: Open a popup under the fullscreen window
  // // Effective? YES. On linux, popup is active under fullscreen window; Esc doesn't exit until the user changes active window (alt+tab, click, etc.)... 
  // const popup = window.open('.', '', availBounds(s0));
  // document.body.requestFullscreen({screen:s0});

  // // Abuse 2B: Post-fullscreen pop-under: Open a window under the pre-fullscreen window bounds and exit fullscreen quickly.
  // // - Open a same-screen popup
  // // - Request fullscreen on the opener to bring it to the front of the z-order
  // // - Exit opener fullscreen to restore pre-fullscreen position with higher z-order
  // // Effective? YES. On linux, popup is active under fullscreen window; Esc doesn't exit until the user changes active window (alt+tab, click, etc.)... 
  // const popup = window.open('.', '', availBounds(s0));
  // document.body.requestFullscreen({screen:s0}); // Opening on display 1 works too...
  // setTimeout(() => { document.exitFullscreen(); }, 700);


  // // 3: Popups can move without activation, unrelated to new affordances around fullscreen.
  // const popup = window.open("notes.html", "", "width=300,height=300");
  // setTimeout(() => { popup.moveBy(100, 200); }, 1000);

  // // Abuse 3A: Move popup under re-activated opener window (needs two clicks).
  // // Effective? YES. Active popups stack over other windows, but inactive popups stack under more recently active windows.
  // const popup = window.open("notes.html", "", "width=300,height=300");
  // document.body.onclick = () => { popup.moveTo(screenX, screenY); }

  // // Abuse 3B: Move popup over another popup (needs Popups & Redirects or two clicks).
  // // Effective? YES. The one with os activation is z-ordered higher; pop-under cannot receive input. Okay...
  // const popup1 = window.open('.', '', availBounds(s0));
  // const popup2 = window.open('.', '', availBounds(s1));
  // setTimeout(() => { console.log("MSW move"); popup.moveTo(slide_window.screenLeft, slide_window.screenTop); }, 3000);


  // // 4: Testing POC Chrome changes to let the popup enter fullscreen.
  // const popup = window.open('.', '', availBounds(s0));
  // setTimeout(() => { console.log("MSW"); toggleElementFullscreen(popup.document.body, 0); }, 700);


  // MSW Scratch notes:

  // setTimeout(() => { document.exitFullscreen(); }, 3000);
  // document.body.requestFullscreen({screen:s1});
  // window.open("notes.html", "_blank", "");
  // setTimeout(() => { window.open("notes.html", "_blank", ""); }, 3000);
  // const popup = window.open('.', '', availBounds(s0));
  // setTimeout(() => { document.exitFullscreen(); }, 3000);
  // setTimeout(() => { document.body.requestFullscreen({screen:s0}); }, 3000);
  // document.body.requestFullscreen({screen:(await getScreens()).screens[1]});
  // window.open('.', '_blank', '');
}
