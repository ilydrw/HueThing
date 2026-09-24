import { DeskThing } from '@deskthing/server';
import { EventMode } from '@deskthing/types';
import type { HardwareInputMode, SetLightColorPayload, SetLightPayload, SetRoomPayload, ToggleAllLightsPayload } from '../../shared/messages.js';
import { Database } from '../db.js';
import { clampBrightnessValue } from '../config.js';
import { registerHueClientHandler, sendHueServerMessage } from '../messages.js';
import type { ServerAppContext } from '../appContext.js';
import type { SimplifiedRoom } from '../hueTypes.js';

interface ControlHandlerOptions {
  startPairingProcess: (bridgeIp: string) => void;
}

export function registerControlHandlers(context: ServerAppContext, options: ControlHandlerOptions) {
  const { hueService, runtime, sendFullState } = context;
  let sceneCursor = -1;

  const resolveRoom = (payload: { roomId?: string; groupedLightId?: string }): SimplifiedRoom | undefined => {
    return hueService.getRooms().find((room) => (
      room.id === payload.roomId || room.groupedLightId === payload.groupedLightId
    ));
  };

  const handleLightUpdate = async (payload: SetLightPayload | undefined) => {
    const lightId = payload?.lightId;
    if (!lightId) return;

    const nextState = {
      ...(payload?.on !== undefined ? { on: payload.on } : {}),
      ...(payload?.brightness !== undefined ? { brightness: clampBrightnessValue(payload.brightness) } : {}),
      ...(payload?.colorXY ? { colorXY: payload.colorXY } : {}),
      ...(payload?.colorTemp !== undefined ? { colorTemp: payload.colorTemp } : {})
    };

    if (await hueService.setLightState(lightId, nextState)) {
      setTimeout(() => sendFullState(), 300);
    }
  };

  const handleRoomUpdate = async (payload: SetRoomPayload | undefined) => {
    const room = resolveRoom(payload || {});
    if (!room) return;

    const nextState = {
      ...(payload?.on !== undefined ? { on: Boolean(payload.on) } : {}),
      ...(payload?.brightness !== undefined ? { brightness: clampBrightnessValue(payload.brightness) } : {})
    };

    if (await hueService.setGroupedLightState(room, nextState)) {
      setTimeout(() => sendFullState(), 300);
    }
  };

  const handleToggleAllLights = async (nextOn?: boolean) => {
    const state = await hueService.fetchAllData();
    const targetState = typeof nextOn === 'boolean' ? nextOn : !state.lights.some((light) => light.on);
    if (await hueService.toggleAllLights(targetState)) {
      setTimeout(() => sendFullState(), 500);
    }
  };

  const adjustRoomBrightness = async (roomId: string | undefined, delta: number) => {
    const rooms = hueService.getRooms();
    let targetRoom = roomId ? rooms.find((room) => room.id === roomId) : rooms.find((room) => room.on);
    if (!targetRoom && rooms.length > 0) targetRoom = rooms[0];

    if (!targetRoom) return;

    const newBrightness = Math.max(1, Math.min(100, targetRoom.brightness + delta));
    const success = await hueService.setGroupedLightState(targetRoom, { on: true, brightness: newBrightness });
    if (!success) return;

    sendHueServerMessage('hueBrightness', { roomId: targetRoom.id, brightness: newBrightness });
    setTimeout(() => sendFullState(), 300);
  };

  const cycleScene = async (direction: 1 | -1) => {
    const scenes = hueService.getScenes();
    if (scenes.length === 0) return;

    sceneCursor = sceneCursor < 0
      ? (direction === 1 ? 0 : scenes.length - 1)
      : (sceneCursor + direction + scenes.length) % scenes.length;
    if (await hueService.activateScene(scenes[sceneCursor].id)) {
      setTimeout(() => sendFullState(), 500);
    }
  };

  registerHueClientHandler('getHueState', () => sendFullState());

  registerHueClientHandler('setLight', async (payload) => handleLightUpdate(payload));
  registerHueClientHandler('setRoom', async (payload) => handleRoomUpdate(payload));

  registerHueClientHandler('setBrightness', async (payload) => {
    const { id, brightness } = payload || {};
    if (!id) return;

    const matchingLight = hueService.getLights().find((light) => light.id === id);
    if (matchingLight) {
      await handleLightUpdate({ lightId: id, brightness, on: true });
      return;
    }

    await handleRoomUpdate({ roomId: id, brightness, on: true });
  });

  registerHueClientHandler('setPower', async (payload) => {
    const { id, on } = payload || {};
    if (!id || typeof on !== 'boolean') return;

    const matchingLight = hueService.getLights().find((light) => light.id === id);
    if (matchingLight) {
      await handleLightUpdate({ lightId: id, on });
      return;
    }

    await handleRoomUpdate({ roomId: id, on });
  });

  registerHueClientHandler('setLightColor', async (payload: SetLightColorPayload | undefined) => {
    const { lightId, hue, saturation, temperature } = payload || {};
    if (!lightId) return;

    const nextState = {
      ...(typeof hue === 'number' ? { hue } : {}),
      ...(typeof saturation === 'number' ? { saturation } : {}),
      ...(typeof temperature === 'number' ? { temperature } : {})
    };

    if (await hueService.setLightColor(lightId, nextState)) {
      setTimeout(() => sendFullState(), 300);
    }
  });

  registerHueClientHandler('activateScene', async (payload) => {
    const { sceneId } = payload || {};
    if (sceneId && await hueService.activateScene(sceneId)) {
      setTimeout(() => sendFullState(), 500);
    }
  });

  registerHueClientHandler('toggleAllLights', async (payload: ToggleAllLightsPayload | undefined) => {
    await handleToggleAllLights(payload?.on);
  });

  registerHueClientHandler('getThemes', () => {
    sendHueServerMessage('themesList', Database.getThemes());
  });

  registerHueClientHandler('saveTheme', (payload) => {
    if (!payload) return;
    Database.saveTheme(payload);
    sendHueServerMessage('themesList', Database.getThemes());
  });

  registerHueClientHandler('cacheScene', (payload) => {
    const { id, name, palette } = payload || {};
    if (id && palette) {
      Database.cacheScene({ id, name, palette });
    }
  });

  DeskThing.on('action', async (data: { payload?: { id?: string } } | undefined) => {
    const actionId = data?.payload?.id;
    if (actionId === 'toggleAllLights') await handleToggleAllLights();
    if (actionId === 'nextScene') await cycleScene(1);
    if (actionId === 'prevScene') await cycleScene(-1);
    if (actionId === 'brightnessUp') await adjustRoomBrightness(undefined, runtime.knobStep);
    if (actionId === 'brightnessDown') await adjustRoomBrightness(undefined, -runtime.knobStep);
    if (actionId === 'serverPair') {
      const ip = hueService.getConfig()?.bridgeIp;
      if (ip) options.startPairingProcess(ip);
    }
  });

  DeskThing.on('key', async (data: { payload?: { id?: string; mode?: EventMode } } | undefined) => {
    const { id, mode } = data?.payload || {};
    if (id !== 'volumeKnob') return;

    const hardwareMode: HardwareInputMode | undefined = mode === EventMode.ScrollUp
      ? 'scrollUp'
      : mode === EventMode.ScrollDown
        ? 'scrollDown'
        : mode === EventMode.PressShort
          ? 'pressShort'
          : mode === EventMode.PressLong
            ? 'pressLong'
            : undefined;

    if (hardwareMode) {
      sendHueServerMessage('hardwareInput', {
        keyId: id,
        mode: hardwareMode,
        ...(hardwareMode === 'scrollUp' || hardwareMode === 'scrollDown' ? { step: runtime.knobStep } : {})
      });
    }
  });
}
