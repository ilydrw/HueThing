import type { ColorPoint, HueState, SyncArea } from './hue';

export interface ThemeColors {
  accent: string;
  bg: string;
  glass: string;
}

export interface StoredTheme {
  id: string;
  name: string;
  colors: ThemeColors;
  layout: string;
}

export interface StoredSceneCache {
  id: string;
  name: string;
  palette: ColorPoint[];
}

export interface PairBridgePayload {
  bridgeIp: string;
}

export interface SetLightPayload {
  lightId: string;
  on?: boolean;
  brightness?: number;
  colorXY?: ColorPoint;
  colorTemp?: number;
}

export interface SetRoomPayload {
  roomId?: string;
  groupedLightId?: string;
  on?: boolean;
  brightness?: number;
}

export interface SetLightColorPayload {
  lightId: string;
  hue?: number;
  saturation?: number;
  temperature?: number;
}

export interface ActivateScenePayload {
  sceneId: string;
}

export interface ToggleAllLightsPayload {
  on?: boolean;
}

export interface StartSyncPayload {
  areaId: string;
}

export interface StopSyncPayload {
  areaId?: string;
}

export interface SyncDataUpdate {
  id: number;
  color: { r: number; g: number; b: number };
}

export interface SyncDataPayload {
  updates: SyncDataUpdate[];
}

export interface PairStatusPayload {
  success?: boolean;
  error?: string;
}

export interface SyncStatusPayload {
  active: boolean;
  areaId: string | null;
}

export interface SyncErrorPayload {
  error: string;
}

export type HardwareInputMode = 'scrollUp' | 'scrollDown' | 'pressShort' | 'pressLong';

export interface HardwareInputPayload {
  keyId: string;
  mode: HardwareInputMode;
  step?: number;
}

export interface BrightnessTelemetryPayload {
  roomId: string;
  brightness: number;
}

export interface HueClientMessageMap {
  getHueState: undefined;
  getSyncAreas: undefined;
  discover: undefined;
  pair: PairBridgePayload;
  cancelPair: undefined;
  setLight: SetLightPayload;
  setRoom: SetRoomPayload;
  setBrightness: { id: string; brightness: number };
  setPower: { id: string; on: boolean };
  setLightColor: SetLightColorPayload;
  activateScene: ActivateScenePayload;
  toggleAllLights: ToggleAllLightsPayload;
  startSync: StartSyncPayload;
  stopSync: StopSyncPayload;
  syncData: SyncDataPayload;
  getThemes: undefined;
  saveTheme: StoredTheme;
  cacheScene: StoredSceneCache;
}

export interface HueServerMessageMap {
  hueState: HueState;
  hueDiscoverResult: string[];
  huePairStatus: PairStatusPayload;
  syncAreas: SyncArea[];
  syncStatus: SyncStatusPayload;
  syncError: SyncErrorPayload;
  hardwareInput: HardwareInputPayload;
  hueBrightness: BrightnessTelemetryPayload;
  themesList: StoredTheme[];
  cachedScenesList: Record<string, StoredSceneCache>;
}

export type HueClientMessageType = keyof HueClientMessageMap;
export type HueServerMessageType = keyof HueServerMessageMap;

export type DeskThingMessage<K extends string, P> = P extends undefined
  ? { type: K }
  : { type: K; payload: P };

export type ClientDeskThingMessage<K extends HueClientMessageType> = DeskThingMessage<K, HueClientMessageMap[K]>;
export type ServerDeskThingMessage<K extends HueServerMessageType> = DeskThingMessage<K, HueServerMessageMap[K]>;

export const HUE_CLIENT_MESSAGE_TYPES = {
  getHueState: 'getHueState',
  getSyncAreas: 'getSyncAreas',
  discover: 'discover',
  pair: 'pair',
  cancelPair: 'cancelPair',
  setLight: 'setLight',
  setRoom: 'setRoom',
  setBrightness: 'setBrightness',
  setPower: 'setPower',
  setLightColor: 'setLightColor',
  activateScene: 'activateScene',
  toggleAllLights: 'toggleAllLights',
  startSync: 'startSync',
  stopSync: 'stopSync',
  syncData: 'syncData',
  getThemes: 'getThemes',
  saveTheme: 'saveTheme',
  cacheScene: 'cacheScene'
} satisfies Record<HueClientMessageType, HueClientMessageType>;

export const HUE_SERVER_MESSAGE_TYPES = {
  hueState: 'hueState',
  hueDiscoverResult: 'hueDiscoverResult',
  huePairStatus: 'huePairStatus',
  syncAreas: 'syncAreas',
  syncStatus: 'syncStatus',
  syncError: 'syncError',
  hardwareInput: 'hardwareInput',
  hueBrightness: 'hueBrightness',
  themesList: 'themesList',
  cachedScenesList: 'cachedScenesList'
} satisfies Record<HueServerMessageType, HueServerMessageType>;
