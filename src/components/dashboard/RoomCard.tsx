import React from 'react';
import type { SimplifiedLight, SimplifiedRoom } from '../../types';
import { HueIcon } from '../HueIcons';
import TogglePill from '../TogglePill';
import { HueSliderView } from '../HueSliderView';
import { buildRoomGradient, getRoomStatusLabel } from './roomVisuals';

interface RoomCardProps {
  room: SimplifiedRoom;
  lights: SimplifiedLight[];
  onOpen: () => void;
  onToggle: () => void;
  onBrightnessChange: (value: number) => void;
  isFocused?: boolean;
}

export default function RoomCard({
  room,
  lights,
  onOpen,
  onToggle,
  onBrightnessChange,
  isFocused = false
}: RoomCardProps) {
  const statusLabel = getRoomStatusLabel(room, lights);
  const background = buildRoomGradient(room, lights);

  return (
    <HueSliderView
      value={room.brightness}
      color={background}
      onChange={() => {}}
      onCommit={onBrightnessChange}
      onClick={onOpen}
      className={`hue-room-card ${room.on ? 'is-on' : 'is-off'} ${isFocused ? 'is-focused' : ''}`}
    >
      <div className="hue-room-card__content">
        <div className="hue-room-card__topline">
          <div className="hue-room-card__identity">
            <div className="hue-room-card__icon">
              <HueIcon type="room" size={18} color="#fff" />
            </div>
            <div>
              <strong>{room.name}</strong>
              <span>{statusLabel}</span>
            </div>
          </div>

          <div onClick={(event) => event.stopPropagation()}>
            <TogglePill checked={room.on} onToggle={onToggle} label={`Toggle ${room.name}`} />
          </div>
        </div>

        <div className="hue-room-card__meta">
          <span>{room.on ? `${Math.round(room.brightness)}% brightness` : 'Room off'}</span>
          <span>Open room <span aria-hidden="true">›</span></span>
        </div>
      </div>
    </HueSliderView>
  );
}
