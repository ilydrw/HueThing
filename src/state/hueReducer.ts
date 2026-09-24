import type { PairStatusPayload, SyncStatusPayload } from '../../shared/messages';
import { EMPTY_HUE_STATE, type HueState, type SyncArea } from '../types';
import { patchAllLightsState, patchLightState, patchRoomState } from './hueOptimistic';

export interface HueStoreState {
  hueState: HueState;
  syncAreas: SyncArea[];
  discoveredBridges: string[];
  pairStatus: PairStatusPayload | null;
  syncStatus: SyncStatusPayload;
  syncError: string | null;
}

export type HueStoreAction =
  | { type: 'hydrateHueState'; payload: HueState }
  | { type: 'hydrateSyncAreas'; payload: SyncArea[] }
  | { type: 'setDiscoveredBridges'; payload: string[] }
  | { type: 'setPairStatus'; payload: PairStatusPayload | null }
  | { type: 'setSyncStatus'; payload: SyncStatusPayload }
  | { type: 'setSyncError'; payload: string | null }
  | { type: 'optimisticLight'; payload: { lightId: string; patch: Partial<HueState['lights'][number]> } }
  | { type: 'optimisticRoom'; payload: { roomId?: string; groupedLightId?: string; patch: Partial<HueState['rooms'][number]> } }
  | { type: 'optimisticToggleAll'; payload: { on: boolean } };

export const initialHueStoreState: HueStoreState = {
  hueState: EMPTY_HUE_STATE,
  syncAreas: [],
  discoveredBridges: [],
  pairStatus: null,
  syncStatus: { active: false, areaId: null },
  syncError: null
};

export function hueReducer(state: HueStoreState, action: HueStoreAction): HueStoreState {
  switch (action.type) {
    case 'hydrateHueState':
      return {
        ...state,
        hueState: action.payload
      };
    case 'hydrateSyncAreas':
      return {
        ...state,
        syncAreas: action.payload
      };
    case 'setDiscoveredBridges':
      return {
        ...state,
        discoveredBridges: action.payload
      };
    case 'setPairStatus':
      return {
        ...state,
        pairStatus: action.payload
      };
    case 'setSyncStatus':
      return {
        ...state,
        syncStatus: action.payload,
        syncError: action.payload.active ? null : state.syncError
      };
    case 'setSyncError':
      return {
        ...state,
        syncError: action.payload
      };
    case 'optimisticLight':
      return {
        ...state,
        hueState: patchLightState(state.hueState, action.payload.lightId, action.payload.patch)
      };
    case 'optimisticRoom':
      return {
        ...state,
        hueState: patchRoomState(state.hueState, action.payload, action.payload.patch)
      };
    case 'optimisticToggleAll':
      return {
        ...state,
        hueState: patchAllLightsState(state.hueState, action.payload.on)
      };
    default:
      return state;
  }
}
