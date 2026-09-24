import React, { useEffect, useMemo, useState } from 'react';
import type { SimplifiedLight } from '../../types';
import { xyToRgb } from '../../types';
import { HueIcon } from '../HueIcons';
import TogglePill from '../TogglePill';

interface RoomLightRowProps {
  light: SimplifiedLight;
  onToggle: () => void;
  onBrightnessChange: (brightness: number) => void;
  onOpenColor?: () => void;
  isFocused?: boolean;
}

function getLightColor(light: SimplifiedLight, brightness: number) {
  if (light.colorXY) {
    return xyToRgb(light.colorXY.x, light.colorXY.y, brightness);
  }

  return 'rgb(255, 214, 170)';
}

export default function RoomLightRow({
  light,
  onToggle,
  onBrightnessChange,
  onOpenColor,
  isFocused = false
}: RoomLightRowProps) {
  const [draftBrightness, setDraftBrightness] = useState(light.brightness);

  useEffect(() => {
    setDraftBrightness(light.brightness);
  }, [light.brightness]);

  const color = useMemo(
    () => getLightColor(light, Math.max(18, draftBrightness)),
    [draftBrightness, light]
  );
  const hasColorControl = light.hasColor || light.hasColorTemp;
  const label = light.hasColor ? 'Color' : 'White';

  const commitBrightness = () => {
    const nextBrightness = Math.round(Math.max(1, Math.min(100, draftBrightness)));
    setDraftBrightness(nextBrightness);
    if (nextBrightness !== Math.round(light.brightness) || !light.on) {
      onBrightnessChange(nextBrightness);
    }
  };

  const sliderBackground = light.on
    ? `linear-gradient(90deg, ${color} 0%, ${color} ${draftBrightness}%, rgba(255,255,255,0.12) ${draftBrightness}%, rgba(255,255,255,0.12) 100%)`
    : 'linear-gradient(90deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.24) 2%, rgba(255,255,255,0.08) 2%, rgba(255,255,255,0.08) 100%)';

  return (
    <article className={`hue-light-row ${light.on ? 'is-on' : 'is-off'} ${isFocused ? 'is-focused' : ''}`}>
      <div className="hue-light-row__topline">
        <div className="hue-light-row__identity">
          <span className="hue-light-row__icon" style={{ color }} aria-hidden="true">
            <HueIcon type="bulb" size={19} color="currentColor" />
          </span>
          <div>
            <strong>{light.name}</strong>
            <span>{light.on ? `${Math.round(draftBrightness)}% brightness` : 'Off'}</span>
          </div>
        </div>

        <div className="hue-light-row__actions">
          {hasColorControl && onOpenColor && (
            <button
              type="button"
              className="hue-light-row__color"
              onClick={onOpenColor}
              aria-label={`${light.hasColor ? 'Adjust color' : 'Adjust white'} for ${light.name}`}
            >
              <span className="hue-light-row__color-dot" style={{ background: color }} aria-hidden="true" />
              {label}
            </button>
          )}
          <TogglePill checked={light.on} onToggle={onToggle} label={`Toggle ${light.name}`} compact />
        </div>
      </div>

      <div className="hue-light-row__slider-line">
        <span className="hue-light-row__slider-label">Brightness</span>
        <input
          type="range"
          min="1"
          max="100"
          step="1"
          value={draftBrightness}
          onChange={(event) => setDraftBrightness(Number(event.currentTarget.value))}
          onPointerUp={commitBrightness}
          onKeyUp={(event) => {
            if (event.key.startsWith('Arrow') || event.key === 'Home' || event.key === 'End') {
              commitBrightness();
            }
          }}
          onBlur={commitBrightness}
          aria-label={`Brightness for ${light.name}`}
          style={{ background: sliderBackground }}
        />
        <output>{light.on ? `${Math.round(draftBrightness)}%` : 'Off'}</output>
      </div>
    </article>
  );
}
