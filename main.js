'use strict';

let permissionStatus = null;
let screenDetails = null;
let popup = null;
let popupObserverInterval = null;

function showWarning(text) {
  const warning = document.getElementById('warning');
  if (text && (warning.innerHTML !== text || warning.hidden))
    console.error(text);
  if (warning) {
    warning.hidden = !text;
    warning.innerHTML = text;
  }
}

window.addEventListener('load', async () => {
  if (!('getScreenDetails' in self || 'getScreens' in self) || !('isExtended' in screen) || !('onchange' in screen)) {
    showWarning("Please try a browser that supports multi-screen features; see the <a href='https://github.com/michaelwasserman/window-placement-demo#instructions'>demo instructions</a>");
  } else {
    screen.addEventListener('change', () => { updateScreens(/*requestPermission=*/false); });
    window.addEventListener('resize', () => { updateScreens(/*requestPermission=*/false); });
    permissionStatus = await navigator.permissions.query({name:'window-placement'});
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
  if ('getScreens' in self || 'getScreenDetails' in self) {
    if (!screenDetails && ((permissionStatus && permissionStatus.state === 'granted') ||
                           (permissionStatus && permissionStatus.state === 'prompt' && requestPermission))) {
      if ('getScreenDetails' in self)
        screenDetails = await getScreenDetails().catch((e)=>{ console.error(e); return null; });
      else if ('getScreens' in self)
        screenDetails = await getScreens().catch((e)=>{ console.error(e); return null; });
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
      showWarning("Please allow the Window Placement permission for full demo functionality");

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
  let screen_space = { left:0, top:0, right:0, bottom:0 };
  for (const screen of screens) {
    screen_space.left = Math.min(screen_space.left, screen.left);
    screen_space.top = Math.min(screen_space.top, screen.top);
    screen_space.right = Math.max(screen_space.right, screen.left + screen.width);
    screen_space.bottom = Math.max(screen_space.bottom, screen.top + screen.height);
  }
  let origin = { left:screen_space.left, top:screen_space.top };
  scale = Math.min(screensCanvas.getBoundingClientRect().width / (screen_space.right-screen_space.left),
                   screensCanvas.getBoundingClientRect().height / (screen_space.bottom-screen_space.top),
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
         ",width=" + options.width + ",height=" + options.height;
}

function openWindow(options = null) {
  if (!options) {
    options = {
      url: openWindowUrlInput.value,
      x: openWindowLeftInput.value,
      y: openWindowTopInput.value,
      width: openWindowWidthInput.value,
      height: openWindowHeightInput.value,
    };
  }
  if (popupObserverInterval)
    clearInterval(popupObserverInterval);
  const features = getFeaturesFromOptions(options);
  console.log('INFO: Opening popup with features: ' + features);
  popup = window.open(options.url, '_blank', features);
  popupObserverInterval = setInterval(() => {
    if (popup.closed) {
      console.log('INFO: The latest popup opened was closed');
      clearInterval(popupObserverInterval);
      popupObserverInterval = null;
      popup = null;
    }
  }, 300);
  return popup;
}

// TODO: Add some worthwhile multi-window opening example?
// async function openWindows() {
//   let count = openWindowsCountInput.value;
//   const screens = await getScreenDetailsWithWarningAndFallback();
//   const per_screen = Math.ceil(count / screens.length);
//   console.log(`openWindows count:${count}, screens:${screens.length}, per_screen:${per_screen}`);
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

async function toggleElementFullscreen(element, screenId) {
  const screens = await getScreenDetailsWithWarningAndFallback();
  if (Number.isInteger(screenId) && screenId >= 0 && screenId < screens.length) {
    console.log('INFO: Requesting fullscreen on screen: ' + screenId);
    await element.requestFullscreen({ screen: screens[screenId] });
  } else if (document.fullscreenElement == element) {
    console.log('INFO: Exiting fullscreen');
    document.exitFullscreen();
  } else {
    console.log('INFO: Requesting fullscreen');
    await element.requestFullscreen();
  }
}

async function toggleFullscreen(screenId) {
  await toggleElementFullscreen(document.documentElement, screenId);
}

async function openSlideWindow(screenId) {
  const screens = await getScreenDetailsWithWarningAndFallback();
  let options = { x:screen.availLeft, y:screen.availTop,
                  width:screen.availWidth, height:screen.availHeight/2 };
  if (screens.length > 1) {
    let screen = screens[1];
    if (Number.isInteger(screenId) && screenId >= 0 && screenId < screens.length)
      screen = screens[screenId];
    options = { x:screen.availLeft, y:screen.availTop,
                width:screen.availWidth, height:screen.availHeight };
  }
  options.url = './slide.html';
  return openWindow(options);
}

async function openNotesWindow(screenId) {
  const screens = await getScreenDetailsWithWarningAndFallback();
  let options = { x:screen.availLeft, y:screen.availTop+screen.availHeight/2,
                  width:screen.availWidth, height:screen.availHeight/2 };
  if (screens.length > 1) {
    let screen = screens[0];
    if (Number.isInteger(screenId) && screenId >= 0 && screenId < screens.length)
      screen = screens[screenId];
    options = { x:screen.availLeft, y:screen.availTop,
                width:screen.availWidth, height:screen.availHeight };
  }
  options.url = './notes.html';
  return openWindow(options);
}

async function openSlideAndNotesWindows() {
  const slideWindow = await openSlideWindow();
  const notesWindow = await openNotesWindow();
  if (slideWindow && notesWindow) {
    const interval = setInterval(() => {
      if (slideWindow.closed || notesWindow.closed) {
        slideWindow.close();
        notesWindow.close();
        clearInterval(interval);
      }
    }, 300);
  }
}

async function fullscreenSlide(screenId) {
  await toggleElementFullscreen(slideIframe, screenId);
}

async function fullscreenSlideAndOpenNotesWindow(screenId) {
  const screens = await getScreenDetailsWithWarningAndFallback();
  if (!Number.isInteger(screenId) || screenId < 0 || screenId >= screens.length)
    screenId = 0;
  await fullscreenSlide(screenId);
  const notesWindow = await openNotesWindow(screenId == 0 ? 1 : 0);
  if (notesWindow) {
    const interval = setInterval(() => {
      if (!document.fullscreenElement && !notesWindow.closed) {
        console.log("MSW fullscreenSlideAndOpenNotesWindow interval close"); 
        // notesWindow.close(); 
        clearInterval(interval);
      } else if (notesWindow.closed && document.fullscreenElement) {
        document.exitFullscreen();
        clearInterval(interval);
      }
    }, 300);
  }
  console.log("MSW popup: " + popup); 
}

async function handleWindowMessage(messageEvent) {
  console.log("MSW handleWindowMessage"); 
  const messageData = messageEvent.data.split(":");
  if (messageData[0] === "request-fullscreen" && messageData.length == 2) {
    const element = document.fullscreenElement ? document.fullscreenElement : document.documentElement;
    await toggleElementFullscreen(element, parseInt(messageData[1]));
  }
}

async function handleWindowKeyup(keyEvent) {
  console.log(keyEvent);
  console.log("MSW handleWindowKeyup + path:" + window.location.pathname + " key:" + (keyEvent.code === "KeyS") + " fullscreen:" + document.fullscreenElement + " popup:" + (popup && !popup.closed) + " extended:" + screen.isExtended); 
  if (window !== window.parent && window.parent.origin === window.origin) {
    console.log("MSW in sub-frame... let the parent handle it"); 
    keyEvent.preventDefault();
    window.parent.handleWindowKeyup(keyEvent);
    return;
  }

  if (keyEvent.code === "Escape" && !["/", "/index.html"].includes(window.location.pathname)) {
    window.close();  // Close secondary windows when pressing [Esc].
  } else if (keyEvent.code === "KeyS" && screen.isExtended) {
    if (popup && !popup.closed) {
      fullscreenThisWindowAndMovePopup();
    } else if (window.opener) {
      fullscreenOpenerAndMoveThisPopup();
    } else {
      fullscreenSlideAndOpenNotesWindow();
    }
  }
 }

function windowOnScreen(w, s) {
  const center = { x: w.screenLeft + w.outerWidth / 2, 
                   y: w.screenTop + w.outerHeight / 2 };

  console.log("windowOnScreen path:" + w.location.pathname + " center:" + center.x + "x" + center.y + " s: " + s.left + "," + s.top + ":" + s.width + "x" + s.height); 
  return center.x >= s.left && (center.x < s.left + s.width) && 
         center.y >= s.top && (center.y < s.top + s.height);
}

function waitForWindowOnScreen(w, s, resolve, reject) {
  console.log("MSW waitForWindowOnScreen A satisfied:" + windowOnScreen(w, s)); 
  if (!w || w.closed || !s) {
    reject();
  } else if (!windowOnScreen(w, s)) {
    setTimeout(waitForWindowOnScreen.bind(this, w, s, resolve), 100);
  } else {
    resolve();
  }
}

async function ensureWindowIsOnScreen(w, screenId) {
  const screens = await getScreenDetailsWithWarningAndFallback();
  if (!Number.isInteger(screenId) || screenId < 0 || screenId >= screens.length)
    screenId = 0;
  const s = screens[screenId];
  console.log("MSW ensureWindowIsOnScreen A w:" + w + " screenId:" + screenId); 
  return new Promise(function (resolve, reject) {
    waitForWindowOnScreen(w, s, resolve, reject);
  });
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

  // popupScreenDetails.screens.indexOf(
  console.log("MSW movePopupToScreen A"); // popup:" + screenId + "->" + popupTargetId + " size: " + window.outerWidth + "x" + window.outerHeight + "(" + screenDetails.currentScreen.availWidth + "x" + screenDetails.currentScreen.availHeight + ")"); 

  if (Math.abs(p.outerWidth - popupScreen.availWidth) < fillError &&
      Math.abs(p.outerHeight - popupScreen.availHeight) < fillError) {
    console.log("MSW movePopupToScreen B fill"); 
    p.moveTo(s.availLeft, s.availTop);
    // Wait for the window to be moved, and then resize it to fill.
    // screenDetails.addEventListener('currentscreenchange', async () => { 
    //   console.log("MSW movePopupToScreen currentscreenchange");  
    //   p.resizeTo(s.availWidth, s.availHeight); 
    // }, { once: true }); 
    await ensureWindowIsOnScreen(p, screenId);
    p.resizeTo(s.availWidth, s.availHeight);
  } else {
    console.log("MSW movePopupToScreen C center"); 
    const w = p.outerWidth;
    const h = p.outerHeight;
    // Compute coordinates centering the window on the target screen.
    const l = s.left + Math.round(s.width - w) / 2;
    const t = s.top + Math.round(s.height - h) / 2;
    p.moveTo(l, t);
  }
}

// MSW: Combine this and fullscreenSlideAndOpenNotesWindow? 
// Make this window fullscreen on the latest popup's screen (or a fallback).
// Also move the latest popup to another screen as needed to avoid being covered.
async function fullscreenThisWindowAndMovePopup() {
  // const screens = await getScreenDetailsWithWarningAndFallback(); 
  // Make this window fullscreen on the screen hosting the latest popup and vice versa.
  const popupScreenDetails = await popup.getScreenDetails();
  const popupId = popupScreenDetails.screens.indexOf(popupScreenDetails.currentScreen);
  const fullscreenId = screenDetails.screens.indexOf(screenDetails.currentScreen);
  let fullscreenTargetId = popupId;
  // If this window is already fullscreen, make sure the request targets another screen.
  if (document.fullscreenElement && fullscreenTargetId == fullscreenId)
    fullscreenTargetId = (fullscreenTargetId + 1) % screenDetails.screens.length;

  const popupTargetScreen = screenDetails.currentScreen; 
  const popupTargetScreenId = screenDetails.screens.indexOf(popupTargetScreen);

  console.log("MSW fullscreenThisWindowAndMovePopup A fullscreen:" + fullscreenId + "->" + fullscreenTargetId); 

  const element = document.fullscreenElement ? document.fullscreenElement : document.documentElement;
  await toggleElementFullscreen(element, fullscreenTargetId);
  await ensureWindowIsOnScreen(window, fullscreenTargetId);

  console.log("MSW fullscreenThisWindowAndMovePopup B popup:" + popupId + "->" + popupTargetScreenId); 

  // await toggleFullscreen(screenDetails.screens[screenId]);


  // let fullscreenTargetScreen = popupScreenDetails.currentScreen;
  // if (popupTargetscreen === fullscreenTargetScreen) {
  //   console.log("MSW same screen swap... "); 
  // }
  await movePopupToScreen(popup, popupTargetScreenId);
  await ensureWindowIsOnScreen(popup, popupTargetScreenId);
}

// Make the opener fullscreen on the target screen (or this popup's screen, or a fallback),
// and move this popup to another screen as needed.
async function fullscreenOpenerAndMoveThisPopup(screenId = null) {
  const screens = await getScreenDetailsWithWarningAndFallback();
  // This function requires multiple screens and transient user activation.
  if (screens.length < 2 || !navigator.userActivation.isActive)
    return;
  // Make the opener fullscreen on the specified target screen, or this window's screen.
  if (!Number.isInteger(screenId) || screenId < 0 || screenId >= screens.length)
    screenId = screens.indexOf(screenDetails.currentScreen);
  const openerScreenDetails = await opener.getScreenDetails();
  const openerId = openerScreenDetails.screens.indexOf(openerScreenDetails.currentScreen);
  // If the opener is already fullscreen, make sure the request targets another screen.
  if (opener.document.fullscreenElement)
    screenId = (openerId == screenId) ? ((screenId + 1) % screens.length) : screenId;
  console.log("MSW fullscreenOpenerAndMoveThisPopup A fullscreen:" + openerId + "->" + screenId); 

  // screenId 

  // Delegate this window's transient user activation so the opener can request fullscreen.
  window.opener.postMessage("request-fullscreen:" + screenId,
                            { targetOrigin: window.origin, delegate: "fullscreen" });
  // Move this window to another screen if the opener will be made fullscreen on its current screen.
  if (screens[screenId] === screenDetails.currentScreen) {
    // // Wait for the opener to actually move to the target screen.
    // openerScreenDetails.addEventListener('currentscreenchange', async () => {
      // MSW: Wait for the window bounds to actually reflect placement on the target screen. 
      await ensureWindowIsOnScreen(window.opener, screenId);

      // Move to the opener's original screen, or the next available screen.
      const popupTargetScreenId = (openerId == screenId) ? ((screenId + 1) % screens.length) : openerId;
      await movePopupToScreen(window, popupTargetScreenId);
      await ensureWindowIsOnScreen(window, popupTargetScreenId);

    // }, { once: true });
  }
}
