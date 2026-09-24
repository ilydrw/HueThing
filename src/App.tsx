import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { HardwareInputPayload } from '../shared/messages';
import { EMPTY_HUE_STATE } from './types';
import Dashboard from './components/Dashboard';
import PairingFlow from './components/PairingFlow';
import RoomPageView from './components/RoomPageView';
import ColorPicker from './components/ColorPicker';
import SplashScreen from './components/SplashScreen';
import SyncDashboard from './components/SyncDashboard';
import { useHueStoreActions, useHueStoreState } from './state';
import { isHuePreview } from './dev/previewState';
import { subscribeHueServerMessage } from './lib/deskthingClient';
import AppShell from './app/AppShell';
import { homeRoute, roomRoute, type AppRoute } from './app/navigation';

type HomeFocus = {
  section: 'all' | 'room' | 'scene';
  index: number;
};

type RoomFocus = {
  section: 'master' | 'light';
  index: number;
};

const PREVIEW_INPUTS: Record<string, HardwareInputPayload['mode']> = {
  ArrowUp: 'scrollUp',
  ArrowRight: 'scrollUp',
  ArrowDown: 'scrollDown',
  ArrowLeft: 'scrollDown',
  Enter: 'pressShort',
  ' ': 'pressShort',
  Escape: 'pressLong'
};

function wrapIndex(index: number, length: number) {
  if (length <= 0) return 0;
  return (index + length) % length;
}

export default function App() {
  const { hueState, syncAreas } = useHueStoreState();
  const hueActions = useHueStoreActions();
  const [view, setView] = useState<'dashboard' | 'pairing' | 'room' | 'splash'>(() => isHuePreview() ? 'dashboard' : 'splash');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedLightId, setSelectedLightId] = useState<string | null>(null);
  const [route, setRoute] = useState<AppRoute>(homeRoute);
  const [hardwareInput, setHardwareInput] = useState<HardwareInputPayload | null>(null);
  const processedHardwareInput = useRef<HardwareInputPayload | null>(null);
  const [homeFocus, setHomeFocus] = useState<HomeFocus>({ section: 'all', index: 0 });
  const [roomFocus, setRoomFocus] = useState<RoomFocus>({ section: 'master', index: 0 });

  const activeHueState = useMemo(() => hueState || EMPTY_HUE_STATE, [hueState]);
  const homeRooms = useMemo(
    () => [...activeHueState.rooms].sort((a, b) => Number(b.on) - Number(a.on)),
    [activeHueState.rooms]
  );
  const homeScenes = useMemo(() => activeHueState.scenes.slice(0, 12), [activeHueState.scenes]);
  const selectedRoom = useMemo(
    () => activeHueState.rooms.find((room) => room.id === selectedRoomId) ?? null,
    [activeHueState.rooms, selectedRoomId]
  );
  const roomLights = useMemo(
    () => selectedRoom ? activeHueState.lights.filter((light) => selectedRoom.lightIds.includes(light.id)) : [],
    [activeHueState.lights, selectedRoom]
  );
  const selectedLight = useMemo(
    () => activeHueState.lights.find((light) => light.id === selectedLightId) ?? null,
    [activeHueState.lights, selectedLightId]
  );

  const navigate = useCallback((nextRoute: AppRoute) => {
    setSelectedLightId(null);
    if (nextRoute.surface === 'room' && nextRoute.roomId) {
      setSelectedRoomId(nextRoute.roomId);
      setRoomFocus({ section: 'master', index: 0 });
      setView('room');
    } else {
      setSelectedRoomId(null);
      setView('dashboard');
    }
    setRoute(nextRoute);
  }, []);

  const handleSplashComplete = () => {
    if (hueState && !hueState.paired && !hueState.connected) {
      setView('pairing');
    } else {
      navigate(homeRoute());
    }
  };

  useEffect(() => {
    if (selectedRoomId && !selectedRoom) {
      navigate(homeRoute());
    }
  }, [navigate, selectedRoom, selectedRoomId]);

  useEffect(() => {
    if (selectedLightId && !selectedLight) {
      setSelectedLightId(null);
    }
  }, [selectedLight, selectedLightId]);

  useEffect(() => {
    if (isHuePreview()) {
      const handlePreviewKey = (event: KeyboardEvent) => {
        const target = event.target as HTMLElement | null;
        if (target?.tagName === 'INPUT') return;

        const mode = PREVIEW_INPUTS[event.key];
        if (!mode) return;

        event.preventDefault();
        setHardwareInput({ keyId: 'preview', mode });
      };

      window.addEventListener('keydown', handlePreviewKey);
      return () => window.removeEventListener('keydown', handlePreviewKey);
    }

    return subscribeHueServerMessage('hardwareInput', setHardwareInput);
  }, []);

  const homeFocusItems = useMemo(
    () => [
      { section: 'all' as const, index: 0 },
      ...homeRooms.map((_, index) => ({ section: 'room' as const, index })),
      ...homeScenes.map((_, index) => ({ section: 'scene' as const, index }))
    ],
    [homeRooms, homeScenes]
  );

  const roomFocusItems = useMemo(
    () => [
      { section: 'master' as const, index: 0 },
      ...roomLights.map((_, index) => ({ section: 'light' as const, index }))
    ],
    [roomLights]
  );

  const handleHardwareInput = useCallback((input: HardwareInputPayload) => {
    if (view === 'splash' || view === 'pairing' || selectedLightId) return;

    if (route.surface === 'home') {
      if (input.mode === 'scrollUp' || input.mode === 'scrollDown') {
        const currentIndex = homeFocusItems.findIndex((item) => (
          item.section === homeFocus.section && item.index === homeFocus.index
        ));
        const nextIndex = wrapIndex(currentIndex + (input.mode === 'scrollUp' ? -1 : 1), homeFocusItems.length);
        setHomeFocus(homeFocusItems[nextIndex] || { section: 'all', index: 0 });
        return;
      }

      if (input.mode === 'pressShort') {
        if (homeFocus.section === 'all') {
          hueActions.toggleAllLights();
        } else if (homeFocus.section === 'room') {
          const room = homeRooms[homeFocus.index];
          if (room) navigate(roomRoute(room.id));
        } else {
          const scene = homeScenes[homeFocus.index];
          if (scene) hueActions.activateScene(scene.id);
        }
      }
      return;
    }

    if (route.surface === 'sync') {
      if (input.mode === 'pressLong') navigate(homeRoute());
      return;
    }

    if (!selectedRoom) return;

    if (input.mode === 'pressLong') {
      const currentIndex = roomFocusItems.findIndex((item) => (
        item.section === roomFocus.section && item.index === roomFocus.index
      ));
      const nextIndex = wrapIndex(currentIndex + 1, roomFocusItems.length);
      setRoomFocus(roomFocusItems[nextIndex] || { section: 'master', index: 0 });
      return;
    }

    if (input.mode === 'pressShort') {
      if (roomFocus.section === 'master') {
        hueActions.toggleRoom(selectedRoom);
      } else {
        const light = roomLights[roomFocus.index];
        if (light) hueActions.toggleLight(light);
      }
      return;
    }

    if (input.mode === 'scrollUp' || input.mode === 'scrollDown') {
      const delta = (input.step || 5) * (input.mode === 'scrollUp' ? 1 : -1);
      if (roomFocus.section === 'master') {
        const nextBrightness = Math.max(1, Math.min(100, selectedRoom.brightness + delta));
        hueActions.setRoomState({ roomId: selectedRoom.id, brightness: nextBrightness, on: true });
      } else {
        const light = roomLights[roomFocus.index];
        if (!light) return;
        const nextBrightness = Math.max(1, Math.min(100, light.brightness + delta));
        hueActions.setLightState({ lightId: light.id, brightness: nextBrightness, on: true });
      }
    }
  }, [homeFocus, homeFocusItems, homeRooms, homeScenes, hueActions, navigate, roomFocus, roomFocusItems, roomLights, route.surface, selectedLightId, selectedRoom, view]);

  useEffect(() => {
    if (!hardwareInput || processedHardwareInput.current === hardwareInput) return;
    processedHardwareInput.current = hardwareInput;
    handleHardwareInput(hardwareInput);
  }, [handleHardwareInput, hardwareInput]);

  const focusedRoomId = homeFocus.section === 'room' ? homeRooms[homeFocus.index]?.id || null : null;
  const focusedSceneId = homeFocus.section === 'scene' ? homeScenes[homeFocus.index]?.id || null : null;
  const focusedLightId = roomFocus.section === 'light' ? roomLights[roomFocus.index]?.id || null : null;

  return (
    <div className="app-container">
      {view === 'splash' ? (
        <SplashScreen onComplete={handleSplashComplete} />
      ) : (
        <div className="view-layer fade-in">
          {view === 'pairing' || (!activeHueState.paired && !activeHueState.connected) ? (
            <PairingFlow
              hueState={activeHueState}
              onPaired={() => navigate(homeRoute())}
            />
          ) : (
            <AppShell
              route={route}
              connected={activeHueState.connected}
              bridgeLabel={activeHueState.bridgeName || activeHueState.bridgeIp}
              onNavigate={navigate}
            >
              {route.surface === 'sync' ? (
                <SyncDashboard entertainmentAreas={syncAreas} />
              ) : view === 'room' && selectedRoom ? (
                <RoomPageView
                  room={selectedRoom}
                  lights={roomLights}
                  scenes={activeHueState.scenes.filter((scene) => scene.roomId === selectedRoom.id)}
                  actions={hueActions}
                  onBack={() => navigate(homeRoute())}
                  onPickColor={(light) => {
                    setHardwareInput(null);
                    setSelectedLightId(light.id);
                  }}
                  isMasterFocused={roomFocus.section === 'master'}
                  focusedLightId={focusedLightId}
                />
              ) : (
                <Dashboard
                  hueState={activeHueState}
                  focusedRoomId={focusedRoomId}
                  focusedSceneId={focusedSceneId}
                  isAllLightsFocused={homeFocus.section === 'all'}
                  actions={hueActions}
                  onFocusRoom={(id) => {
                    const room = activeHueState.rooms.find((candidate) => candidate.id === id);
                    if (room) navigate(roomRoute(room.id));
                  }}
                  greeting=""
                />
              )}
            </AppShell>
          )}
        </div>
      )}

      {selectedLight && (
        <ColorPicker
          light={selectedLight}
          hardwareInput={hardwareInput}
          onClose={() => setSelectedLightId(null)}
        />
      )}
    </div>
  );
}
