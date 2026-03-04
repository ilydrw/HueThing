# HueThing for DeskThing

Control your Philips Hue ecosystem directly from your Spotify Car Thing using the DeskThing application!

## Features
- **Local Control:** Communicates directly with your Philips Hue Bridge over your local netowork for blazing-fast response times.
- **Auto-Discovery:** Easily find your Hue Bridge on the network.
- **Dynamic Dashboard:** Real-time state syncing of your Rooms and Lights.
- **Lighting Control:** Toggle individual lights or entire rooms, adjust brightness, and configure physical Car Thing buttons to trigger actions.
- **Scene Support:** Activate any predefined scenes in your rooms.
- **Easy Pairing:** Guided 3-step setup process directly from the DeskThing interface.

## Prerequisites
- A Spotify Car Thing configured with [DeskThing](https://github.com/itsjakeism/DeskThing).
- A Philips Hue Bridge.

## Physical Controls
You can map your physical Car Thing inputs through DeskThing under the `Actions` or `Keys` settings:
- **Keys:** Map the volume knob to brightness control.
- **Actions:** Map the buttons to "Toggle All Lights," "Next Scene," "Previous Scene," and more!

## Developing
This app is built mainly using React, TypeScript, and Vite on the frontend, and Node.js on the backend.

1. Clone this repository.
2. Run `npm install` to grab dependencies.
3. Build the backend using `npm run build:server`.
4. Build the frontend using `npm run build:client`.
5. Run the overall build with `npm run build` which will produce the `.zip` file for DeskThing.

Enjoy your HueThing setup!
