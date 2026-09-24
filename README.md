<img width="1280" height="640" alt="HueThingWordmark" src="https://github.com/user-attachments/assets/aa0034d8-c7f4-406f-b65d-82eaafbc8a10" />

# HueThing for DeskThing

Control your Philips Hue ecosystem directly from your Spotify Car Thing using the DeskThing application!

## Features
- **Local Control:** Communicates directly with your Philips Hue Bridge over your local network for blazing-fast response times.
- **Auto-Discovery:** Easily find your Hue Bridge on the network.
- **Dynamic Dashboard:** Real-time state syncing of your Rooms and Lights.
- **Lighting Control:** Toggle individual lights or entire rooms, adjust brightness, and configure physical Car Thing buttons to trigger actions.
- **Scene Support:** Activate any predefined scenes in your rooms.
- **Easy Pairing:** Guided 3-step setup process directly from the DeskThing interface.
- **Sync Features:** This app uses the Philips Hue Entertainment API for real-time light syncing.

## Prerequisites
- A Spotify Car Thing configured with [DeskThing](https://github.com/ItsRiprod/DeskThing).
- A Philips Hue Bridge.
- **FOR SYNC FEATURES ONLY:** A Philips Hue Bridge that supports the Entertainment API (most 2nd gen and newer do).
- **FOR SYNC FEATURES ONLY:** Ensure UDP Port 2100 is open on your firewall.
- **FOR SYNC FEATURES ONLY:** Ensure Node Build Tools installed (npm install --global windows-build-tools on Windows or xcode-select --install on Mac) to compile the DTLS library.

## Physical Controls
You can map your physical Car Thing inputs through DeskThing under the `Actions` or `Keys` settings:
- **Keys:** Map the volume knob to brightness control.
- **Actions:** Map the buttons to "Toggle All Lights," "Next Scene," "Previous Scene," and more!

## Developing
This app is built mainly using React, TypeScript, and Vite on the frontend, and Node.js on the backend.


**Note for Sync Features:** This app uses the Philips Hue Entertainment API for real-time light syncing.
- Ensure you have Node Build Tools installed (npm install --global windows-build-tools on Windows or xcode-select --install on Mac) to compile the DTLS library.
- You must re-pair your Bridge using the link button within this app to generate the necessary security keys for streaming.
- Ensure UDP Port 2100 is open on your firewall.

1. Clone this repository.
2. Run `npm install` to grab dependencies.
3. Build the backend using `npm run build:server`.
4. Build the frontend using `npm run build:client`.
5. Run the overall build with `npm run build` which will produce the `.zip` file for DeskThing.

Enjoy your HueThing setup!
