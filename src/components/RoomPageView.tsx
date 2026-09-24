import React from 'react';
import type { SimplifiedLight, SimplifiedRoom, SimplifiedScene } from '../types';
import type { HueActions } from '../state';
import { HueIcon } from './HueIcons';
import { HueSceneGallery } from './HueSceneGallery';
import { HueSliderView } from './HueSliderView';
import RoomLightRow from './room/RoomLightRow';
import TogglePill from './TogglePill';
import { buildRoomGradient } from './dashboard/roomVisuals';

interface RoomPageViewProps {
  room: SimplifiedRoom;
  lights: SimplifiedLight[];
  scenes: SimplifiedScene[];
  actions: HueActions;
  onBack: () => void;
  onPickColor: (light: SimplifiedLight) => void;
  isMasterFocused?: boolean;
  focusedLightId?: string | null;
}

export default function RoomPageView({
  room,
  lights,
  scenes,
  actions,
  onBack,
  onPickColor,
  isMasterFocused = false,
  focusedLightId = null
}: RoomPageViewProps) {
  const activeLights = lights.filter((light) => light.on).length;
  const roomGradient = buildRoomGradient(room, lights);
  const [draftBrightness, setDraftBrightness] = React.useState(room.brightness);

  React.useEffect(() => {
    setDraftBrightness(room.brightness);
  }, [room.brightness]);

  return (
    <div className="hue-page hue-room-detail no-scrollbar">
      <header className="hue-room-detail__header">
        <button type="button" className="hue-icon-button" onClick={onBack} aria-label="Back to Home">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <div className="hue-room-detail__title">
          <p className="hue-eyebrow">Room</p>
          <h1>{room.name}</h1>
        </div>
        <div className="hue-room-detail__status">
          <span>{activeLights} of {lights.length} lights on</span>
          <TogglePill checked={room.on} onToggle={() => actions.toggleRoom(room)} label={`Toggle ${room.name}`} compact />
        </div>
      </header>

      <div className="hue-room-detail__body">
        <section className={`hue-room-master ${room.on ? 'is-on' : ''} ${isMasterFocused ? 'is-focused' : ''}`}>
          <div className="hue-room-master__heading">
            <span className="hue-room-master__icon">
              <HueIcon type={room.archetype || 'room'} size={22} color="currentColor" />
            </span>
            <div>
              <p className="hue-eyebrow">Room controls</p>
              <h2>Whole room</h2>
            </div>
          </div>

          <div className="hue-room-master__value">
            <strong>{room.on ? Math.round(draftBrightness) : 0}</strong>
            <span>%</span>
          </div>

          <div className="hue-room-master__label-row">
            <span>Brightness</span>
            <span>{room.on ? `${activeLights} of ${lights.length} lights on` : 'Room is off'}</span>
          </div>

          <HueSliderView
            value={room.on ? draftBrightness : 0}
            color={roomGradient}
            onChange={setDraftBrightness}
            onCommit={(brightness) => {
              setDraftBrightness(brightness);
              actions.setRoomState({ roomId: room.id, brightness, on: true });
            }}
            className="hue-room-master__slider"
          />
          <p className="hue-room-master__hint">Drag left or right to dim the whole room.</p>
        </section>

        <div className="hue-room-detail__content">
          <section className="hue-room-section hue-room-scenes">
            <div className="hue-section-heading hue-section-heading--compact">
              <div>
                <p className="hue-eyebrow">Quick atmosphere</p>
                <h2>Scenes</h2>
              </div>
              <span>{scenes.length} presets</span>
            </div>
            {scenes.length > 0 ? (
              <HueSceneGallery scenes={scenes} onSelect={actions.activateScene} />
            ) : (
              <div className="hue-inline-empty">No scenes saved for this room.</div>
            )}
          </section>

          <section className="hue-room-section hue-room-lights">
            <div className="hue-section-heading hue-section-heading--compact">
              <div>
                <p className="hue-eyebrow">Individual control</p>
                <h2>Lights</h2>
              </div>
              <span>{lights.length} fixtures</span>
            </div>

            {lights.length > 0 ? (
              <div className="hue-light-list no-scrollbar">
                {lights.map((light) => (
                  <RoomLightRow
                    key={light.id}
                    light={light}
                    isFocused={focusedLightId === light.id}
                    onToggle={() => actions.toggleLight(light)}
                    onBrightnessChange={(brightness) => actions.setLightState({ lightId: light.id, brightness, on: true })}
                    onOpenColor={() => onPickColor(light)}
                  />
                ))}
              </div>
            ) : (
              <div className="hue-inline-empty">No lights are assigned to this room.</div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
