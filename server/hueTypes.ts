// Philips Hue v2 API type definitions

export type {
  HueState,
  SimplifiedLight,
  SimplifiedRoom,
  SimplifiedScene,
  SyncArea
} from '../shared/hue.js';

export {
  EMPTY_HUE_STATE,
  xyToRgb
} from '../shared/hue.js';

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
  children: Array<{ rid: string; rtype: 'light' | 'device' | 'grouped_light' | string }>
  services: Array<{ rid: string; rtype: 'light' | 'grouped_light' | string }>
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

