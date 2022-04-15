'use strict';

let permissionStatus = null;
let screenDetails = null;

function showWarning(text) {
  if (warning) {
    warning.hidden = !text;
    warning.innerHTML = text;
  }
  if (text)
    console.error(text);
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

function setScreenListeners() {
  let screens = screenDetails ? screenDetails.screens : [ window.screen ];
  for (const s of screens)
    s.onchange = () => { updateScreens(/*requestPermission=*/false); };
}

async function getScreenDetailsWithWarningAndFallback(requestPermission) {
  if ('getScreens' in self || 'getScreenDetails' in self) {
    if (!screenDetails && (permissionStatus.state === 'granted' ||
                              (permissionStatus.state === 'prompt' && requestPermission))) {
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
  showScreens(screens);

  if (document.getElementById('toggleFullscreenDropdown')) {
    while (toggleFullscreenDropdown.children.length > 2)
      toggleFullscreenDropdown.children[2].remove();
    for (let i = 0; i < screens.length; ++i)
      toggleFullscreenDropdown.innerHTML += screens[i] == window.screen ? `` : `<button onclick="toggleFullscreen(${i})"> Screen ${i}</button>`;
  }
  if (document.getElementById('fullscreenSlideDropdown')) {
    while (fullscreenSlideDropdown.children.length > 2)
      fullscreenSlideDropdown.children[2].remove();
    for (let i = 0; i < screens.length; ++i)
      fullscreenSlideDropdown.innerHTML += screens[i] == window.screen ? `` : `<button onclick="fullscreenSlide(${i})"> Screen ${i}</button>`;
  }
  if (document.getElementById('fullscreenSlideAndOpenNotesWindowDropdown')) {
    while (fullscreenSlideAndOpenNotesWindowDropdown.children.length > 2)
      fullscreenSlideAndOpenNotesWindowDropdown.children[2].remove();
    for (let i = 0; i < screens.length; ++i)
      fullscreenSlideAndOpenNotesWindowDropdown.innerHTML += screens[i] == window.screen ? `` : `<button onclick="fullscreenSlideAndOpenNotesWindow(${i})"> Screen ${i}</button>`;
  }
  return screens;
}

function getFeaturesFromOptions(options) {
  return "left=" + options.x + ",top=" + options.y +
         ",width=" + options.width + ",height=" + options.height;
}

function openWindow() {
  const url = openWindowUrlInput.value;
  const options = {
    x: openWindowLeftInput.value,
    y: openWindowTopInput.value,
    width: openWindowWidthInput.value,
    height: openWindowHeightInput.value,
  };
  // TODO: Support openWindow(options) if available.
  window.open(url, '_blank', getFeaturesFromOptions(options));
}

// TODO: Add some worthwhile multi-window opening example?
// async function openWindows() {
//   let count = openWindowsCountInput.value;
//   const screens = await updateScreens(/*requestPermission=*/false);
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
  toggleElementFullscreen(slideIframe, screenId);
}

async function fullscreenSlideAndOpenNotesWindow(screenId) {
  if (typeof(screenId) != "number")
    screenId = 0;
  fullscreenSlide(screenId);
  openNotesWindow(screenId == 0 ? 1 : 0);
}