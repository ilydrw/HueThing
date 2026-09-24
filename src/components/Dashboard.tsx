import React from 'react';
import type { HueState } from '../types';
import type { HueActions } from '../state';
import { HueSceneGallery } from './HueSceneGallery';
import AllLightsCard from './dashboard/AllLightsCard';
import RoomCard from './dashboard/RoomCard';
import { getRoomLights } from './dashboard/roomVisuals';

interface DashboardProps {
  hueState: HueState;
  greeting: string;
  focusedRoomId: string | null;
  focusedSceneId?: string | null;
  isAllLightsFocused?: boolean;
  onFocusRoom: (id: string | null) => void;
  onScroll?: (y: number) => void;
  actions: HueActions;
}

export default function Dashboard({
  hueState,
  greeting,
  focusedRoomId,
  focusedSceneId = null,
  isAllLightsFocused = false,
  onFocusRoom,
  onScroll,
  actions
}: DashboardProps) {
  const anyLightsOn = hueState.lights.some((light) => light.on);
  const activeLights = hueState.lights.filter((light) => light.on).length;
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    onScroll?.(event.currentTarget.scrollTop);
  };

  const rooms = [...hueState.rooms].sort((a, b) => Number(b.on) - Number(a.on));

  return (
    <div
      onScroll={handleScroll}
      className="hue-page hue-home no-scrollbar"
    >
      <header className="hue-page-header hue-page-header--home">
        <div>
          <p className="hue-eyebrow">{greeting || timeGreeting}</p>
          <h1>Home</h1>
          <p className="hue-page-header__hint">Set the mood in one tap</p>
        </div>
        <div className="hue-page-header__summary" aria-label={`${activeLights} lights on`}>
          <span className="hue-page-header__glow" aria-hidden="true" />
          <strong>{activeLights}</strong>
          <span>of {hueState.lights.length} on</span>
        </div>
      </header>

      <AllLightsCard
        anyLightsOn={anyLightsOn}
        activeLights={activeLights}
        totalLights={hueState.lights.length}
        isFocused={isAllLightsFocused}
        onToggle={() => actions.toggleAllLights(!anyLightsOn)}
      />

      <section>
        <div className="hue-section-heading">
          <div>
            <p className="hue-eyebrow">Rooms & zones</p>
            <h2>Your lights</h2>
          </div>
          <span>{rooms.length} spaces</span>
        </div>

        {rooms.length > 0 ? (
          <div className="hue-room-grid">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                lights={getRoomLights(room, hueState.lights)}
                onOpen={() => onFocusRoom(room.id)}
                onToggle={() => actions.toggleRoom(room)}
                onBrightnessChange={(brightness) => actions.setRoomState({ roomId: room.id, brightness, on: true })}
                isFocused={focusedRoomId === room.id}
              />
            ))}
          </div>
        ) : (
          <div className="hue-empty-state">
            <strong>No rooms found</strong>
            <span>Add a room in the Hue app, then refresh your bridge.</span>
            <button type="button" onClick={actions.refreshHueState}>Refresh</button>
          </div>
        )}
      </section>

      {hueState.scenes.length > 0 && (
        <section>
          <div className="hue-section-heading">
            <div>
              <p className="hue-eyebrow">One-tap atmosphere</p>
              <h2>Scenes</h2>
            </div>
            <span>{hueState.scenes.length} presets</span>
          </div>
          <HueSceneGallery
            scenes={hueState.scenes.slice(0, 12)}
            onSelect={(sceneId) => actions.activateScene(sceneId)}
            focusedSceneId={focusedSceneId}
          />
        </section>
      )}
    </div>
  );
}
