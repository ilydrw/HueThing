import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import type { PairBridgePayload, SetLightColorPayload, SyncDataUpdate } from '../../shared/messages';
import type { SimplifiedLight, SimplifiedRoom } from '../types';
import { sendHueClientMessage, subscribeHueServerMessage } from '../lib/deskthingClient';
import { hueReducer, initialHueStoreState, type HueStoreState } from './hueReducer';
import { createHuePreviewState, isHuePreview } from '../dev/previewState';

export interface HueActions {
  refreshHueState: () => void;
  refreshSyncAreas: () => void;
  discoverBridges: () => void;
  pairBridge: (payload: PairBridgePayload) => void;
  cancelPairing: () => void;
  setLightState: (payload: { lightId: string; on?: boolean; brightness?: number }) => void;
  setRoomState: (payload: { roomId?: string; groupedLightId?: string; on?: boolean; brightness?: number }) => void;
  toggleLight: (light: SimplifiedLight) => void;
  toggleRoom: (room: SimplifiedRoom) => void;
  setLightColor: (payload: SetLightColorPayload) => void;
  activateScene: (sceneId: string) => void;
  toggleAllLights: (on?: boolean) => void;
  startSync: (areaId: string) => void;
  stopSync: (areaId?: string) => void;
  sendSyncData: (updates: SyncDataUpdate[]) => void;
}

const HueStateContext = createContext<HueStoreState | null>(null);
const HueActionsContext = createContext<HueActions | null>(null);

export function HueStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(
    hueReducer,
    undefined,
    () => isHuePreview() ? createHuePreviewState() : initialHueStoreState
  );

  useEffect(() => {
    if (isHuePreview()) return;

    const removeHueState = subscribeHueServerMessage('hueState', (payload) => {
      dispatch({ type: 'hydrateHueState', payload });
    });
    const removeDiscover = subscribeHueServerMessage('hueDiscoverResult', (payload) => {
      dispatch({ type: 'setDiscoveredBridges', payload });
      dispatch({ type: 'setPairStatus', payload: null });
    });
    const removePair = subscribeHueServerMessage('huePairStatus', (payload) => {
      dispatch({ type: 'setPairStatus', payload });
    });
    const removeSyncAreas = subscribeHueServerMessage('syncAreas', (payload) => {
      dispatch({ type: 'hydrateSyncAreas', payload });
    });
    const removeSyncStatus = subscribeHueServerMessage('syncStatus', (payload) => {
      dispatch({ type: 'setSyncStatus', payload });
    });
    const removeSyncError = subscribeHueServerMessage('syncError', (payload) => {
      dispatch({ type: 'setSyncError', payload: payload.error });
    });

    sendHueClientMessage('getHueState');

    return () => {
      removeHueState?.();
      removeDiscover?.();
      removePair?.();
      removeSyncAreas?.();
      removeSyncStatus?.();
      removeSyncError?.();
    };
  }, []);

  useEffect(() => {
    if (isHuePreview()) return;

    if (state.hueState.connected && state.hueState.paired) {
      sendHueClientMessage('getSyncAreas');
      return;
    }

    dispatch({ type: 'hydrateSyncAreas', payload: [] });
    dispatch({ type: 'setSyncStatus', payload: { active: false, areaId: null } });
  }, [state.hueState.connected, state.hueState.paired]);

  const actions = useMemo<HueActions>(() => ({
    refreshHueState: () => sendHueClientMessage('getHueState'),
    refreshSyncAreas: () => sendHueClientMessage('getSyncAreas'),
    discoverBridges: () => {
      dispatch({ type: 'setDiscoveredBridges', payload: [] });
      dispatch({ type: 'setPairStatus', payload: null });
      sendHueClientMessage('discover');
    },
    pairBridge: (payload) => {
      dispatch({ type: 'setPairStatus', payload: null });
      sendHueClientMessage('pair', payload);
    },
    cancelPairing: () => {
      dispatch({ type: 'setPairStatus', payload: null });
      sendHueClientMessage('cancelPair');
    },
    setLightState: (payload) => {
      dispatch({
        type: 'optimisticLight',
        payload: {
          lightId: payload.lightId,
          patch: {
            ...(payload.on !== undefined ? { on: payload.on } : {}),
            ...(payload.brightness !== undefined ? { brightness: payload.brightness, on: true } : {})
          }
        }
      });
      sendHueClientMessage('setLight', payload);
    },
    setRoomState: (payload) => {
      dispatch({
        type: 'optimisticRoom',
        payload: {
          roomId: payload.roomId,
          groupedLightId: payload.groupedLightId,
          patch: {
            ...(payload.on !== undefined ? { on: payload.on } : {}),
            ...(payload.brightness !== undefined ? { brightness: payload.brightness, on: true } : {})
          }
        }
      });
      sendHueClientMessage('setRoom', payload);
    },
    toggleLight: (light) => {
      dispatch({
        type: 'optimisticLight',
        payload: {
          lightId: light.id,
          patch: { on: !light.on }
        }
      });
      sendHueClientMessage('setLight', { lightId: light.id, on: !light.on });
    },
    toggleRoom: (room) => {
      dispatch({
        type: 'optimisticRoom',
        payload: {
          roomId: room.id,
          patch: { on: !room.on }
        }
      });
      sendHueClientMessage('setRoom', { roomId: room.id, on: !room.on });
    },
    setLightColor: (payload) => sendHueClientMessage('setLightColor', payload),
    activateScene: (sceneId) => sendHueClientMessage('activateScene', { sceneId }),
    toggleAllLights: (on) => {
      const nextOn = typeof on === 'boolean' ? on : !state.hueState.lights.some((light) => light.on);
      dispatch({ type: 'optimisticToggleAll', payload: { on: nextOn } });
      sendHueClientMessage('toggleAllLights', { on: nextOn });
    },
    startSync: (areaId) => {
      dispatch({ type: 'setSyncError', payload: null });
      sendHueClientMessage('startSync', { areaId });
    },
    stopSync: (areaId) => sendHueClientMessage('stopSync', { areaId }),
    sendSyncData: (updates) => {
      if (updates.length === 0) return;
      sendHueClientMessage('syncData', { updates });
    }
  }), [state.hueState.lights]);

  return (
    <HueStateContext.Provider value={state}>
      <HueActionsContext.Provider value={actions}>
        {children}
      </HueActionsContext.Provider>
    </HueStateContext.Provider>
  );
}

export function useHueStoreState() {
  const context = useContext(HueStateContext);
  if (!context) {
    throw new Error('useHueStoreState must be used inside HueStoreProvider');
  }
  return context;
}

export function useHueStoreActions() {
  const context = useContext(HueActionsContext);
  if (!context) {
    throw new Error('useHueStoreActions must be used inside HueStoreProvider');
  }
  return context;
}
