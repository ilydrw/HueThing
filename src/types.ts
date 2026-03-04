// Shared types for client-side (mirrored from server/hueTypes.ts)

export interface SimplifiedLight {
  id: string
  name: string
  on: boolean
  brightness: number
  colorXY?: { x: number; y: number }
  colorTemp?: number
  colorTempRange?: { min: number; max: number }
  hasColor: boolean
  hasColorTemp: boolean
  roomId?: string
}

export interface SimplifiedRoom {
  id: string
  name: string
  groupedLightId?: string
  on: boolean
  brightness: number
  lightIds: string[]
  sceneIds: string[]
}

export interface SimplifiedScene {
  id: string
  name: string
  roomId: string
  colors: Array<{ x: number; y: number; brightness: number }>
}

export interface HueState {
  connected: boolean
  paired: boolean
  bridgeIp: string
  lights: SimplifiedLight[]
  rooms: SimplifiedRoom[]
  scenes: SimplifiedScene[]
}

// CIE xy to CSS rgb conversion
export function xyToRgb(x: number, y: number, brightness: number = 100): string {
  const z = 1.0 - x - y
  const Y = brightness / 100
  const X = (Y / y) * x
  const Z = (Y / y) * z

  let r = X * 1.656492 - Y * 0.354851 - Z * 0.255038
  let g = -X * 0.707196 + Y * 1.655397 + Z * 0.036152
  let b = X * 0.051713 - Y * 0.121364 + Z * 1.011530

  // Apply gamma correction
  r = r <= 0.0031308 ? 12.92 * r : (1.0 + 0.055) * Math.pow(r, 1.0 / 2.4) - 0.055
  g = g <= 0.0031308 ? 12.92 * g : (1.0 + 0.055) * Math.pow(g, 1.0 / 2.4) - 0.055
  b = b <= 0.0031308 ? 12.92 * b : (1.0 + 0.055) * Math.pow(b, 1.0 / 2.4) - 0.055

  r = Math.max(0, Math.min(1, r))
  g = Math.max(0, Math.min(1, g))
  b = Math.max(0, Math.min(1, b))

  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`
}

// Mirek to CSS rgb for color temperature
export function mirekToRgb(mirek: number): string {
  const kelvin = 1000000 / mirek
  let r: number, g: number, b: number
  const temp = kelvin / 100

  if (temp <= 66) {
    r = 255
    g = 99.4708025861 * Math.log(temp) - 161.1195681661
    b = temp <= 19 ? 0 : 138.5177312231 * Math.log(temp - 10) - 305.0447927307
  } else {
    r = 329.698727446 * Math.pow(temp - 60, -0.1332047592)
    g = 288.1221695283 * Math.pow(temp - 60, -0.0755148492)
    b = 255
  }

  r = Math.max(0, Math.min(255, r))
  g = Math.max(0, Math.min(255, g))
  b = Math.max(0, Math.min(255, b))

  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
}

// Color presets in CIE xy space
export const COLOR_PRESETS = [
  { name: 'Warm White', x: 0.4578, y: 0.4101, css: '#FFD699' },
  { name: 'Cool White', x: 0.3227, y: 0.3290, css: '#F0F0FF' },
  { name: 'Red', x: 0.6750, y: 0.3220, css: '#FF3333' },
  { name: 'Orange', x: 0.5926, y: 0.3840, css: '#FF8833' },
  { name: 'Yellow', x: 0.4877, y: 0.4594, css: '#FFD700' },
  { name: 'Green', x: 0.2151, y: 0.7106, css: '#33CC33' },
  { name: 'Cyan', x: 0.1700, y: 0.3400, css: '#33CCCC' },
  { name: 'Blue', x: 0.1530, y: 0.0480, css: '#3366FF' },
  { name: 'Purple', x: 0.2703, y: 0.1398, css: '#9933FF' },
  { name: 'Pink', x: 0.3944, y: 0.1979, css: '#FF33BB' },
  { name: 'Hot Pink', x: 0.4682, y: 0.2405, css: '#FF3377' },
  { name: 'Lavender', x: 0.3000, y: 0.2600, css: '#BB99FF' }
]
