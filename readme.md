# VisionMouse

This repo contains a Tampermonkey browser extension script that allows you to use gestures to control a web browser. This project is very primitive and mostly functions as a proof-of-concept for how to integrate [Tensorflow hand tracking](https://blog.tensorflow.org/2021/11/3D-handpose.html) with Tampermonkey to allow browser control.

### Installing the script
1. If you don't already have [Tampermonkey](https://www.tampermonkey.net/) installed, follow this link to install it.
1. Once you have Tampermonkey installed, click [this link](https://raw.githubusercontent.com/nickkantack/VisionMouse/refs/heads/mainline/VisionMouse.user.js) to install the script from this repository.

### Building locally
1. Clone this repository
1. Run `npm install`
1. Run `npx webpack`
1. Your built script will be found in the `dist/` directory and can be imported to a project of your choosing.
