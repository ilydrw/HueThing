import type { HueState, SimplifiedLight, SimplifiedRoom } from '../types';

const roundBrightness = (value: number) => Math.max(1, Math.min(100, Math.round(value)));

function recalculateRooms(hueState: HueState, rooms: SimplifiedRoom[] = hueState.rooms, lights: SimplifiedLight[] = hueState.lights) {
  return rooms.map((room) => {
    const roomLights = lights.filter((light) => room.lightIds.includes(light.id));
    if (roomLights.length === 0) return room;

    const litLights = roomLights.filter((light) => light.on);
    const nextBrightness = litLights.length > 0
      ? roundBrightness(litLights.reduce((total, light) => total + light.brightness, 0) / litLights.length)
      : room.brightness;

    return {
      ...room,
      on: litLights.length > 0,
      brightness: nextBrightness
    };
  });
}

export function patchLightState(hueState: HueState, lightId: string, patch: Partial<SimplifiedLight>): HueState {
  const nextLights = hueState.lights.map((light) => (
    light.id === lightId
      ? {
          ...light,
          ...patch,
          ...(patch.brightness !== undefined ? { brightness: roundBrightness(patch.brightness) } : {})
        }
      : light
  ));

  return {
    ...hueState,
    lights: nextLights,
    rooms: recalculateRooms(hueState, hueState.rooms, nextLights)
  };
}

export function patchRoomState(
  hueState: HueState,
  target: { roomId?: string; groupedLightId?: string },
  patch: Partial<SimplifiedRoom>
): HueState {
  const targetRoom = hueState.rooms.find((room) => room.id === target.roomId || room.groupedLightId === target.groupedLightId);
  if (!targetRoom) return hueState;

  const nextRooms = hueState.rooms.map((room) => (
    room.id === targetRoom.id
      ? {
          ...room,
          ...patch,
          ...(patch.brightness !== undefined ? { brightness: roundBrightness(patch.brightness) } : {})
        }
      : room
  ));

  const nextLights = hueState.lights.map((light) => {
    if (!targetRoom.lightIds.includes(light.id)) return light;

    return {
      ...light,
      ...(patch.on !== undefined ? { on: patch.on } : {}),
      ...(patch.brightness !== undefined ? { brightness: roundBrightness(patch.brightness) } : {}),
      ...(patch.on === true ? { on: true } : {})
    };
  });

  return {
    ...hueState,
    lights: nextLights,
    rooms: recalculateRooms(hueState, nextRooms, nextLights)
  };
}

export function patchAllLightsState(hueState: HueState, on: boolean): HueState {
  const nextLights = hueState.lights.map((light) => ({ ...light, on }));
  const nextRooms = hueState.rooms.map((room) => ({ ...room, on }));

  return {
    ...hueState,
    lights: nextLights,
    rooms: recalculateRooms(hueState, nextRooms, nextLights)
  };
}
