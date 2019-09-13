# Window Placement and Screen Enumeration APIs Demo

## Abstract

This is a basic demo of the proposed
[Screen Enumeration](https://github.com/spark008/screen-enumeration) and
[Window Placement](https://github.com/spark008/window-placement) APIs.

This demo depends on recent work and unmerged changes to Chrome:
* [Screen Enumeration: Basic Implementation](https://chromium-review.googlesource.com/c/chromium/src/+/1759890)
  * Available on Chromium 78 Canary and Dev channels with a command-line switch:
    * --enable-blink-features=ScreenEnumeration
* [\[WIP\] Fugu: Exploring new openWindow options](https://chromium-review.googlesource.com/c/chromium/src/+/1767282)
  * Unmerged, local build needed to call openWindow() with options.

## Instructions

Get this demo and host it locally:
```console
$ cd /src
$ git clone https://github.com/michaelwasserman/window-placement-demo.git
$ cd window-placement-demo
$ python -m SimpleHTTPServer
```

Apply the WIP window placement changes, build and run:
```console
$ cd /src/chromium/src
$ git cl patch -b wip_window_placement_api https://chromium-review.googlesource.com/c/chromium/src/+/1767282
$ autoninja -C out/Default chrome
$ out/Default/chrome --enable-blink-features=ScreenEnumeration -- "http://localhost:8000"
```

To simulate multiple displays with [linux-chromeos](https://chromium.googlesource.com/chromiumos/docs/+/master/simple_chrome_workflow.md)
builds, use [--ash-host-window-bounds](https://cs.chromium.org/chromium/src/ui/display/display_switches.cc?type=cs&q=ash-host-window-bounds&sq=package:chromium&g=0&l=34-40):
```console
$ out/cros_Default/chrome --enable-blink-features=ScreenEnumeration --ash-host-window-bounds=1280x960,1285+0-1280x960 -- "http://localhost:8000"
```

## Screen Capture

Demo screen capture: linux-chromeos with two virtual displays draws a screen-space diagram and opens windows on both displays<br>
<a href="demo_screen_capture.webm"><img src="demo_screen_capture.png" alt="Demo Screen Capture - linux-chromeos with two virtual displays" width="1200"></a>
