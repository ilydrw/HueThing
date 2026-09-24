import type { SimplifiedLight, SimplifiedRoom } from '../../types';
import { xyToRgb } from '../../types';

const WARM_WHITE = 'rgb(255, 214, 170)';

export function getRoomLights(room: SimplifiedRoom, lights: SimplifiedLight[]) {
  return lights.filter((light) => room.lightIds.includes(light.id));
}

export function getLightColor(light: SimplifiedLight) {
  if (light.colorXY) {
    return xyToRgb(light.colorXY.x, light.colorXY.y, Math.max(18, light.brightness));
  }

  return WARM_WHITE;
}

export function getRoomColors(room: SimplifiedRoom, lights: SimplifiedLight[]) {
  const activeLights = getRoomLights(room, lights).filter((light) => light.on);
  const colors = activeLights.map(getLightColor);

  return colors.length > 0 ? colors : ['rgba(255,255,255,0.12)'];
}

export function buildRoomGradient(room: SimplifiedRoom, lights: SimplifiedLight[]) {
  const colors = getRoomColors(room, lights);
  const [first, second = first, third = second] = colors;

  if (!room.on) {
    return [
      'linear-gradient(135deg, rgba(42, 44, 48, 0.92), rgba(18, 18, 21, 0.98))',
      'radial-gradient(circle at 18% 30%, rgba(255,255,255,0.06), transparent 36%)'
    ].join(', ');
  }

  return [
    `radial-gradient(circle at 18% 26%, ${first} 0%, transparent 34%)`,
    `radial-gradient(circle at 74% 32%, ${second} 0%, transparent 32%)`,
    `radial-gradient(circle at 54% 74%, ${third} 0%, transparent 36%)`,
    'linear-gradient(135deg, rgba(25,25,30,0.28), rgba(9,9,12,0.72))'
  ].join(', ');
}

export function getRoomStatusLabel(room: SimplifiedRoom, lights: SimplifiedLight[]) {
  const roomLights = getRoomLights(room, lights);
  const activeCount = roomLights.filter((light) => light.on).length;

  if (activeCount === 0) {
    return `${roomLights.length} lights off`;
  }

  return `${activeCount} of ${roomLights.length} lights on`;
}
