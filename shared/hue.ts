export interface ColorPoint {
  x: number;
  y: number;
}

export interface ColorTemperatureRange {
  min: number;
  max: number;
}

export interface SimplifiedLight {
  id: string;
  name: string;
  on: boolean;
  brightness: number;
  colorXY?: ColorPoint;
  colorTemp?: number;
  colorTempRange?: ColorTemperatureRange;
  hasColor: boolean;
  hasColorTemp: boolean;
  id_v1?: string;
  roomId?: string;
  roomName?: string;
  archetype?: string;
  modelId?: string;
  isBle?: boolean;
}

export interface SimplifiedRoom {
  id: string;
  name: string;
  groupedLightId?: string;
  v1GroupId?: string;
  archetype?: string;
  on: boolean;
  brightness: number;
  lightIds: string[];
  sceneIds: string[];
}

export interface SimplifiedSceneColor {
  x: number;
  y: number;
  brightness: number;
}

export interface SimplifiedScene {
  id: string;
  name: string;
  roomId: string;
  colors: SimplifiedSceneColor[];
  isDynamic?: boolean;
}

export interface HueState {
  connected: boolean;
  paired: boolean;
  bridgeIp: string;
  bridgeName?: string;
  modelId?: string;
  lights: SimplifiedLight[];
  rooms: SimplifiedRoom[];
  scenes: SimplifiedScene[];
}

export interface SyncAreaLocation {
  lightId: string;
  position?: { x: number; y: number; z: number };
}

export interface SyncArea {
  id: string;
  name: string;
  locations: SyncAreaLocation[];
}

export const EMPTY_HUE_STATE: HueState = {
  connected: false,
  paired: false,
  bridgeIp: '',
  bridgeName: '',
  modelId: '',
  lights: [],
  rooms: [],
  scenes: []
};

export function xyToRgb(x: number, y: number, brightness: number = 100): string {
  const safeY = y || 0.0001;
  const z = 1.0 - x - y;
  const Y = brightness / 100;
  const X = (Y / safeY) * x;
  const Z = (Y / safeY) * z;

  let r = X * 1.656492 - Y * 0.354851 - Z * 0.255038;
  let g = -X * 0.707196 + Y * 1.655397 + Z * 0.036152;
  let b = X * 0.051713 - Y * 0.121364 + Z * 1.01153;

  r = r <= 0.0031308 ? 12.92 * r : (1.0 + 0.055) * Math.pow(r, 1.0 / 2.4) - 0.055;
  g = g <= 0.0031308 ? 12.92 * g : (1.0 + 0.055) * Math.pow(g, 1.0 / 2.4) - 0.055;
  b = b <= 0.0031308 ? 12.92 * b : (1.0 + 0.055) * Math.pow(b, 1.0 / 2.4) - 0.055;

  return `rgb(${Math.round(Math.max(0, Math.min(1, r)) * 255)}, ${Math.round(Math.max(0, Math.min(1, g)) * 255)}, ${Math.round(Math.max(0, Math.min(1, b)) * 255)})`;
}

export function getRelativeLuminance(color: string): number {
  const matches = color.match(/\d+/g);
  if (!matches) return 1;

  const [r, g, b] = matches.map(Number).map((value) => {
    const scaled = value / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : Math.pow((scaled + 0.055) / 1.055, 2.4);
  });

  return (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
}
