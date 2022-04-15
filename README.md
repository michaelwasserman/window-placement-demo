# Multi-Screen Window Placement Demo

## Abstract

This is a basic demo of
[Multi-Screen Window Placement](https://github.com/w3c/window-placement) APIs.
* Visualize the set of connected displays
* Open or move a popup window onto any connected display
* Request fullscreen on any connected display
* Swap fullscreen from one display to another

## Instructions

Run the demo at https://michaelwasserman.github.io/window-placement-demo
* Use Chrome 100+ (which enables Multi-Screen Window Placement APIs by default)
* Or use Chrome 93+ and enable chrome://flags#enable-experimental-web-platform-features
* Or use Chrome 93+ and run chrome --enable-blink-features=WindowPlacement
* Or use Chrome 100+ and run chrome --enable-features=WindowPlacement

**[Optional]** Host this demo locally and run it:
```console
$ git clone https://github.com/michaelwasserman/window-placement-demo.git
$ cd window-placement-demo
$ python -m http.server &
$ chrome -- "http://localhost:8000"
```

To simulate multiple displays with
[linux-chromeos](https://chromium.googlesource.com/chromiumos/docs/+/master/simple_chrome_workflow.md)
builds, use
[--ash-host-window-bounds](https://cs.chromium.org/chromium/src/ui/display/display_switches.cc?type=cs&q=ash-host-window-bounds&sq=package:chromium&g=0&l=34-40):
```console
$ out/cros_Default/chrome --ash-host-window-bounds=1280x960,1285+0-1280x960 -- "http://localhost:8000"
```

## Screen Capture

Demo screen capture: linux-chromeos with two virtual displays draws a screen-space diagram and opens windows on both displays<br>
<a href="demo_screen_capture.webm"><img src="demo_screen_capture.png" alt="Demo Screen Capture - linux-chromeos with two virtual displays" width="1200"></a>
