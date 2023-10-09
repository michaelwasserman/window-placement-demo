'use strict';

let permissionStatus = null;
let screenDetails = null;
let popup = null;
let popupObserverInterval = null;
let handlingMultiScreenRequest = false;

function showWarning(text) {
  const warning = document.getElementById('warning');
  if (warning && warning.innerHTML !== text) {
    if (text)
      console.error(text);
    warning.hidden = !text;
    warning.innerHTML = text;
  }
}

window.addEventListener('load', async () => {
  if (!('getScreenDetails' in self) || !('isExtended' in screen) || !('onchange' in screen)) {
    showWarning("Please try a browser that supports multi-screen features; see the <a href='https://github.com/michaelwasserman/window-placement-demo#instructions'>demo instructions</a>");
  } else {
    screen.addEventListener('change', () => { updateScreens(/*requestPermission=*/false); });
    window.addEventListener('resize', () => { updateScreens(/*requestPermission=*/false); });
    permissionStatus = await navigator.permissions.query({name:'window-management'});
    permissionStatus.addEventListener('change', (p) => { permissionStatus = p; updateScreens(/*requestPermission=*/false); });
  }
  updateScreens(/*requestPermission=*/false);
});

window.addEventListener('keyup', handleWindowKeyup);

function setScreenListeners() {
  let screens = screenDetails ? screenDetails.screens : [ window.screen ];
  for (const s of screens)
    s.onchange = () => { updateScreens(/*requestPermission=*/false); };
}

async function getScreenDetailsWithWarningAndFallback(requestPermission = false) {
  if ('getScreenDetails' in self) {
    if (!screenDetails && ((permissionStatus && permissionStatus.state === 'granted') ||
                           (permissionStatus && permissionStatus.state === 'prompt' && requestPermission))) {
      screenDetails = await getScreenDetails().catch(e =>{ console.error(e); return null; });
      if (screenDetails) {
        screenDetails.addEventListener('screenschange', () => { updateScreens(/*requestPermission=*/false); setScreenListeners(); });
        setScreenListeners();
      }
    }
    if (screenDetails && screenDetails.screens.length > 1)
      showWarning();  // Clear any warning.
    else if (screenDetails && screenDetails.screens.length == 1)
      showWarning("Please extend your desktop over multiple screens for full demo functionality");
    else if (requestPermission || permissionStatus.state === 'denied')
      showWarning("Please allow the Window Management permission for full demo functionality");

    if (screenDetails) {
      // console.log("INFO: Detected " + screenDetails.screens.length + " screens:");
      // for (let i = 0; i < screenDetails.screens.length; ++i) {
      //   const s = screenDetails.screens[i];
      //   console.log(`[${i}] "${s.label}" ` +
      //               `[${s.left},${s.top} ${s.width}x${s.height}] ` +
      //               `(${s.availLeft},${s.availTop} ${s.availWidth}x${s.availHeight}) ` +
      //               `devicePixelRatio:${s.devicePixelRatio} colorDepth:${s.colorDepth} ` +
      //               `isExtended:${s.isExtended} isPrimary:${s.isPrimary} isInternal:${s.isInternal}`);
      // }
      return screenDetails.screens;
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

  const context = screensCanvas.getContext('2d');
  context.clearRect(0, 0, screensCanvas.width, screensCanvas.height);

  let scale = 1.0/10.0;
  let screenSpace = { left:0, top:0, right:0, bottom:0 };
  for (const screen of screens) {
    screenSpace.left = Math.min(screenSpace.left, screen.left);
    screenSpace.top = Math.min(screenSpace.top, screen.top);
    screenSpace.right = Math.max(screenSpace.right, screen.left + screen.width);
    screenSpace.bottom = Math.max(screenSpace.bottom, screen.top + screen.height);
  }
  let origin = { left:screenSpace.left, top:screenSpace.top };
  scale = Math.min(screensCanvas.getBoundingClientRect().width / (screenSpace.right-screenSpace.left),
                   screensCanvas.getBoundingClientRect().height / (screenSpace.bottom-screenSpace.top),
                   0.5);
  const colors = [ "#FF2222", "#22FF22", "#2222FF" ];
  const availColors = [ "#FFAAAA", "#AAFFAA", "#AAAAFF" ];
  for (let i = 0; i < screens.length; ++i) {
    const screen = screens[i];
    const rect = { left:(screen.left-origin.left)*scale, top:(screen.top-origin.top)*scale, width:screen.width*scale, height:screen.height*scale };
    context.fillStyle = colors[i%colors.length];
    context.fillRect(rect.left, rect.top, rect.width, rect.height);
    const availrect = { left:(screen.availLeft-origin.left)*scale, top:(screen.availTop-origin.top)*scale, width:screen.availWidth*scale, height:screen.availHeight*scale };
    context.fillStyle = availColors[i%colors.length];
    context.fillRect(availrect.left, availrect.top, availrect.width, availrect.height);
    context.fillStyle = "#000000";
    context.font = "13px Arial";
    context.fillText(screen == window.screen ? '[window.screen]' : `[${i}] "${screen.label}" ${screen.isPrimary ? '(Primary)': ''}`, rect.left+10, rect.top+20);
    context.fillText(`${screen.left},${screen.top} ${screen.width}x${screen.height}`, rect.left+10, rect.top+35);
    context.fillText(`devicePixelRatio:${screen.devicePixelRatio}, colorDepth:${screen.colorDepth}`, rect.left+10, rect.top+50);
    context.fillText(`isExtended:${screen.isExtended}` + (screen == window.screen ? `` : `, isInternal:${screen.isInternal}`), rect.left+10, rect.top+65);
  }

  const rect = { left:(window.screenLeft-origin.left)*scale, top:(window.screenTop-origin.top)*scale, width:window.outerWidth*scale, height:window.outerHeight*scale };
  context.strokeStyle = "#444444";
  context.fillStyle = "#444444";
  context.strokeRect(rect.left, rect.top, rect.width, rect.height);
  context.fillText(`window ${window.screenLeft},${window.screenTop} ${window.outerWidth}x${window.outerHeight}`, rect.left+10, rect.top+rect.height-10);
}

async function updateScreens(requestPermission = true) {
  const screens = await getScreenDetailsWithWarningAndFallback(requestPermission);
  if (document.getElementById('screensCanvas'))
    showScreens(screens);

  if (document.getElementById('toggleFullscreenDropdown')) {
    toggleFullscreenDropdown.innerHTML = ``;
    for (let i = 0; i < screens.length; ++i)
      toggleFullscreenDropdown.innerHTML += screens[i] == window.screen ? `` : `<button onclick="toggleFullscreen(${i})"> Screen ${i}</button>`;
  }
  if (document.getElementById('fullscreenPopupDropdown')) {
    fullscreenPopupDropdown.innerHTML = ``;
    for (let i = 0; i < screens.length; ++i)
      fullscreenPopupDropdown.innerHTML += screens[i] == window.screen ? `` : `<button onclick="fullscreenPopup(${i})"> Screen ${i}</button>`;
  }
  if (document.getElementById('fullscreenSlideDropdown')) {
    fullscreenSlideDropdown.innerHTML = ``;
    for (let i = 0; i < screens.length; ++i)
      fullscreenSlideDropdown.innerHTML += screens[i] == window.screen ? `` : `<button onclick="fullscreenSlide(${i})"> Screen ${i}</button>`;
  }
  if (document.getElementById('fullscreenSlideAndOpenNotesWindowDropdown')) {
    fullscreenSlideAndOpenNotesWindowDropdown.innerHTML = ``;
    for (let i = 0; i < screens.length; ++i)
      fullscreenSlideAndOpenNotesWindowDropdown.innerHTML += screens[i] == window.screen ? `` : `<button onclick="fullscreenSlideAndOpenNotesWindow(${i})"> Screen ${i}</button>`;
  }
  if (document.getElementById('fullscreenOpenerDropdown')) {
    fullscreenOpenerDropdown.innerHTML = ``;
    for (let i = 0; i < screens.length; ++i)
      fullscreenOpenerDropdown.innerHTML += screens[i] == window.screen ? `` : `<button onclick="fullscreenOpenerAndMoveThisPopup(${i})"> Screen ${i}</button>`;
  }
  return screens;
}

function getFeaturesFromOptions(options) {
  return "left=" + options.x + ",top=" + options.y +
         ",width=" + options.width + ",height=" + options.height +
         (options.fullscreen ? ",fullscreen" : "");
}

function openWindow(options = null) {
  if (!options || !options.url) {
    options = {
      url: openWindowUrlInput.value,
      x: openWindowLeftInput.value,
      y: openWindowTopInput.value,
      width: openWindowWidthInput.value,
      height: openWindowHeightInput.value,
      fullscreen: openWindowFullscreenInput.checked
    };
  }
  if (popupObserverInterval)
    clearInterval(popupObserverInterval);
  const features = getFeaturesFromOptions(options);
  popup = window.open(options.url, '_blank', features);
  console.log('INFO: Requested popup with features: "' + features + '" result: ' + popup);
  if (popup) {
    popupObserverInterval = setInterval(() => {
      if (popup.closed) {
        console.log('INFO: The latest-opened popup was closed');
        clearInterval(popupObserverInterval);
        popupObserverInterval = null;
        popup = null;
      }
    }, 300);
  }
  return popup;
}

// TODO: Add some worthwhile multi-window opening example?
// async function openWindows() {
//   let count = openWindowsCountInput.value;
//   let popups = [];
//   const screens = await getScreenDetailsWithWarningAndFallback();
//   const perScreen = Math.ceil(count / screens.length);
//   console.log(`openWindows count:${count}, screens:${screens.length}, perScreen:${perScreen}`);
//   for (const s of screens) {
//     const cols = Math.ceil(Math.sqrt(perScreen));
//     const rows = Math.ceil(perScreen / cols);
//     for (let r = 0; r < rows; ++r) {
//       for (let c = 0; c < cols && count-- > 0; ++c) {
//         const options = {
//           x: s.availLeft + s.availWidth * c / cols,
//           y: s.availTop + s.availHeight * r / rows,
//           width: s.availWidth / cols,
//           height: s.availHeight / rows,
//         };
//         const url = `data:text/html;charset=utf-8,<title>row:${r} col:${c}</title><h1>row:${r} col:${c}</h1>`;
//         console.log(`INFO: opening window row:${r} col:${c}, (${options.x},${options.y} ${options.width}x${options.height}`);
//         popups.push(window.open(url, '_blank', getFeaturesFromOptions(options)));
//       }
//     }
//   }
//   const interval = setInterval(() => {
//     if (popups.some(p => p.closed)) {
//       popups.forEach(p => p.close());
//       clearInterval(interval);
//     }
//   }, 300);
// }

async function toggleElementFullscreen(element, screenId) {
  const screens = await getScreenDetailsWithWarningAndFallback();
  if (Number.isInteger(screenId) && screenId >= 0 && screenId < screens.length) {
    console.log('INFO: Requesting fullscreen on screen: ' + screenId);
    await element.requestFullscreen({ screen: screens[screenId] });
    await ensureWindowIsOnScreen(window, screenId);
  } else if (document.fullscreenElement == element) {
    console.log('INFO: Exiting fullscreen');
    await document.exitFullscreen();
  } else {
    console.log('INFO: Requesting fullscreen');
    await element.requestFullscreen();
  }
}

async function toggleFullscreen(screenId) {
  await toggleElementFullscreen(document.documentElement, screenId);
}

async function openNotesWindow(screenId) {
  const screens = await getScreenDetailsWithWarningAndFallback();
  const s = screens[screenId] || screens[0] || window.screen;
  const options = { url:'./notes.html', x:s.availLeft, y:s.availTop,
                    width:s.availWidth, height:s.availHeight };
  return openWindow(options);
}

async function fullscreenPopup(screenId) {
  const screens = await getScreenDetailsWithWarningAndFallback(/*requestPermission=*/true);
  const s = screens[screenId] || screens[0] || window.screen;
  const options = { url:'./popup.html', fullscreen: true,
                    x:s.availLeft, y:s.availTop,
                    width:s.availWidth, height:s.availHeight };
  return openWindow(options);
}

async function fullscreenSlide(screenId) {
  await toggleElementFullscreen(slideIframe, screenId);
}

async function fullscreenSlideAndOpenNotesWindow(screenId) {
  const screens = await getScreenDetailsWithWarningAndFallback();
  if (!Number.isInteger(screenId) || screenId < 0 || screenId >= screens.length)
    screenId = 0;
  await fullscreenSlide(screenId);
  // Await potential async fullscreen space transitions. If the Mac preference
  // "Displays have separate Spaces" is disabled, then opening a popup window
  // while the target display is transitioning to another space may put the
  // window in the wrong space (i.e. it won't be visible). See crbug.com/1401041
  await new Promise(r => setTimeout(r, 700));
  // Find the screen where the window was actually made fullscreen. This may not
  // match the request if the window was made fullscreen within the tab area,
  // which happens when the tab content is being captured for video streaming.
  screenId = screenDetails.screens.indexOf(screenDetails.currentScreen);
  const notesWindow = await openNotesWindow(screenId == 0 ? 1 : 0);
  if (notesWindow && screens.length > 1) {
    const interval = setInterval(() => {
      if (!document.fullscreenElement && !notesWindow.closed) {
        notesWindow.close();
        clearInterval(interval);
      } else if (document.fullscreenElement && notesWindow.closed) {
        document.exitFullscreen();
        clearInterval(interval);
      }
    }, 300);
  }
}

async function handleWindowMessage(messageEvent) {
  if (typeof(messageEvent.data) === "object" && messageEvent.data.capability === "fullscreen") {
    // Request to use a fullscreen capability delegated by another window; reply with the result.
    const element = document.fullscreenElement ? document.fullscreenElement : document.documentElement;
    console.log("INFO: Requesting fullscreen via delegated capability");
    toggleElementFullscreen(element, messageEvent.data.targetScreenId)
      .then(() => { messageEvent.source.postMessage(true); })
      .catch(() => { messageEvent.source.postMessage(false); });
  }
}

async function handleWindowKeyup(keyEvent) {
  // If the event targeted a same-origin iframe, allow the parent to handle it instead.
  if (window !== window.parent && window.parent.origin === window.origin) {
    window.parent.handleWindowKeyup(keyEvent);
    return;
  }

  if (keyEvent.code === "Escape" && !["/index.html", "/window-placement-demo/"].includes(window.location.pathname)) {
    window.close();  // Close auxiliary windows on [Esc].
  } else if (keyEvent.code === "Enter" && openWindowControls && openWindowControls.contains(keyEvent.target)) {
    openWindow();  // Open a window when on [Enter] targeting an "Open window" input element.
  } else if (keyEvent.code === "KeyS" && screen.isExtended) {
    // Bail to avoid issuing concurrent conflicting asynchronous multi-screen requests.
    // Browsers may drop fullscreen for security if popup and fullscreen displays coincide.
    if (handlingMultiScreenRequest) {
      console.log("INFO: Throttling multi-screen placement requests");
      return;
    }
    handlingMultiScreenRequest = true;
    // Initiate a fullscreen + popup multi-screen experience, or swap their screens on [s].
    if (popup && !popup.closed)
      await fullscreenThisWindowAndMovePopup();
    else if (opener && !opener.closed)
      await fullscreenOpenerAndMoveThisPopup();
    else if (document.getElementById("slideIframe"))
      await fullscreenSlideAndOpenNotesWindow();
    handlingMultiScreenRequest = false;
  }
}

async function isWindowOnScreen(w, screenId) {
  const windowScreenDetails = await w.getScreenDetails();
  const screen = windowScreenDetails.screens[screenId];
  const center = { x: w.screenLeft + w.outerWidth / 2,
                   y: w.screenTop + w.outerHeight / 2 };
  return center.x >= screen.left && (center.x < screen.left + screen.width) &&
         center.y >= screen.top && (center.y < screen.top + screen.height) &&
         windowScreenDetails.currentScreen == screen;
}

async function waitForWindowOnScreen(w, screenId, resolve, timestamp = Date.now()) {
  if (!w || w.closed || Date.now() - timestamp > 3000)
    resolve(false);
  else if (await isWindowOnScreen(w, screenId))
    resolve(true);
  else
    setTimeout(waitForWindowOnScreen.bind(this, w, screenId, resolve, timestamp), 100);
}

async function ensureWindowIsOnScreen(w, screenId) {
  return new Promise(resolve => { waitForWindowOnScreen(w, screenId, resolve); });
}

async function movePopupToScreen(p, screenId) {
  const screens = await getScreenDetailsWithWarningAndFallback();
  if (!Number.isInteger(screenId) || screenId < 0 || screenId >= screens.length)
    screenId = 0;
  const s = screens[screenId];

  // Fill the target screen if the window does so on the current screen, otherwise center.
  const fillError = 100;
  const popupScreenDetails = await p.getScreenDetails();
  const popupScreen = popupScreenDetails.currentScreen;

  console.log("INFO: Moving popup to screen: " + screenId);
  if (Math.abs(p.outerWidth - popupScreen.availWidth) < fillError &&
      Math.abs(p.outerHeight - popupScreen.availHeight) < fillError) {
    p.moveTo(s.availLeft, s.availTop);
    // Wait for the window to be moved to the target screen, and then resize it to fill.
    if (await ensureWindowIsOnScreen(p, screenId))
      p.resizeTo(s.availWidth, s.availHeight);
  } else {
    const w = p.outerWidth;
    const h = p.outerHeight;
    // Compute coordinates centering the window on the target screen.
    const l = s.left + Math.round(s.width - w) / 2;
    const t = s.top + Math.round(s.height - h) / 2;
    p.moveTo(l, t);
    await ensureWindowIsOnScreen(p, screenId);
  }
}

// Make this window fullscreen on the popup's screen (or a fallback).
// Also move the popup to another screen as needed to avoid being covered.
async function fullscreenThisWindowAndMovePopup() {
  const screens = await getScreenDetailsWithWarningAndFallback();
  // This function requires multiple screens, transient user activation, and a popup.
  if (screens.length < 2 || !navigator.userActivation.isActive || !popup || popup.closed)
    return;
  const popupScreenDetails = await popup.getScreenDetails();
  const popupId = popupScreenDetails.screens.indexOf(popupScreenDetails.currentScreen);
  const fullscreenId = screenDetails.screens.indexOf(screenDetails.currentScreen);
  let fullscreenTargetId = popupId;
  // If this window is already fullscreen, make sure the request targets another screen.
  if (document.fullscreenElement && fullscreenTargetId == fullscreenId)
    fullscreenTargetId = (fullscreenTargetId + 1) % screenDetails.screens.length;

  const element = document.fullscreenElement ? document.fullscreenElement : document.documentElement;
  await toggleElementFullscreen(element, fullscreenTargetId);
  if (await ensureWindowIsOnScreen(window, fullscreenTargetId)) {
    // Move the popup to this window's previous screen, or the next available screen.
    const popupTargetId = (screens[fullscreenId] === screenDetails.currentScreen) ? ((fullscreenId + 1) % screens.length) : fullscreenId;
    await movePopupToScreen(popup, popupTargetId);
  }
}

async function delegateFullscreen(w, screenId) {
  return new Promise((resolve) => {
    console.log('INFO: Requesting to delegate a fullscreen request capability');
    window.addEventListener('message', (messageEvent) => {
      if (typeof(messageEvent.data) === 'boolean') {
        console.log('INFO Target window reported fullscreen delegation result: ' + messageEvent.data);
        resolve(messageEvent.data);
      }
    }, { once: true });
    w.postMessage({ capability: 'fullscreen', targetScreenId: screenId },
                  { targetOrigin: window.origin, delegate: 'fullscreen' });
  });
}

// Make the opener fullscreen on the target screen (or this popup's screen, or a fallback).
// Also move this popup to another screen as needed to avoid being covered.
async function fullscreenOpenerAndMoveThisPopup(screenId = null) {
  const screens = await getScreenDetailsWithWarningAndFallback();
  // This function requires transient user activation, and an opener.
  if (!navigator.userActivation.isActive || !opener || opener.closed)
    return;
  // Make the opener fullscreen on the specified target screen, or this window's screen.
  if (!Number.isInteger(screenId) || screenId < 0 || screenId >= screens.length)
    screenId = screens.indexOf(screenDetails.currentScreen);
  const openerScreenDetails = await opener.getScreenDetails();
  const openerId = openerScreenDetails.screens.indexOf(openerScreenDetails.currentScreen);

  // Delegate this window's transient user activation so the opener can request fullscreen.
  // Wait for the opener to actually move to the target screen if it reports successful delegation.
  if (await delegateFullscreen(opener, screenId) && await ensureWindowIsOnScreen(opener, screenId)) {
    // If the opener was made fullscreen on the same screen as this popup and there's another screen.
    if (screens[screenId] === screenDetails.currentScreen && screens.length > 1) {
      // Move this popup to the opener's previous screen, or the next available screen.
      const popupTargetId = (screens[openerId] === screenDetails.currentScreen) ? ((openerId + 1) % screens.length) : openerId;
      await movePopupToScreen(window, popupTargetId);
    }
  }
}
