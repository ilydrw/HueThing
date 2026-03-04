// Philips Hue v2 API type definitions

export interface HueBridgeConfig {
  bridgeIp: string
  appKey: string
  clientKey?: string
}

export interface HueColor {
  xy: { x: number; y: number }
}

export interface HueColorTemperature {
  mirek: number | null
  mirek_valid: boolean
  mirek_schema?: { mirek_minimum: number; mirek_maximum: number }
}

export interface HueDimming {
  brightness: number
  min_dim_level?: number
}

export interface HueLightOn {
  on: boolean
}

export interface HueLight {
  id: string
  id_v1?: string
  type: 'light'
  metadata: {
    name: string
    archetype: string
  }
  on: HueLightOn
  dimming?: HueDimming
  color?: HueColor
  color_temperature?: HueColorTemperature
  dynamics?: { status: string; speed: number }
  owner: { rid: string; rtype: string }
}

export interface HueRoom {
  id: string
  type: 'room'
  metadata: {
    name: string
    archetype: string
  }
  children: Array<{ rid: string; rtype: string }>
  services: Array<{ rid: string; rtype: string }>
}

export interface HueGroupedLight {
  id: string
  type: 'grouped_light'
  on: HueLightOn
  dimming?: HueDimming
  owner: { rid: string; rtype: string }
}

export interface HueScene {
  id: string
  type: 'scene'
  metadata: {
    name: string
    image?: { rid: string; rtype: string }
  }
  group: { rid: string; rtype: string }
  actions: Array<{
    target: { rid: string; rtype: string }
    action: {
      on?: HueLightOn
      dimming?: HueDimming
      color?: HueColor
      color_temperature?: { mirek: number }
    }
  }>
  palette?: {
    color: Array<{ color: HueColor; dimming: HueDimming }>
    color_temperature: Array<{ color_temperature: { mirek: number }; dimming: HueDimming }>
  }
  status?: { active: string }
}

export interface HueApiResponse<T> {
  errors: Array<{ description: string }>
  data: T[]
}

// Simplified types for client communication
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

// Message types for client-server communication
export type HueMessageType =
  | 'hueState'
  | 'hueLights'
  | 'hueRooms'
  | 'hueScenes'
  | 'hueError'
  | 'huePairStatus'
  | 'hueDiscoverResult'

export type HueRequestType =
  | 'getState'
  | 'discover'
  | 'pair'
  | 'setLight'
  | 'setRoom'
  | 'activateScene'
  | 'toggleAll'
  | 'setBridgeIp'
