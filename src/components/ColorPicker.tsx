import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { HardwareInputPayload } from '../../shared/messages';
import { SimplifiedLight } from '../types';
import { ColorWheel } from './color-picker/ColorWheel';
import { TemperatureSlider } from './color-picker/TemperatureSlider';
import { clamp, getInitialColorState, MAX_MIREK, MIN_MIREK, useDynamicContrast } from './color-picker/colorUtils';
import { useHueStoreActions } from '../state';

interface ColorPickerProps {
  light: SimplifiedLight;
  hardwareInput?: HardwareInputPayload | null;
  onClose: () => void;
}

type ColorMode = 'wheel' | 'temperature';

export default function ColorPicker({ light, hardwareInput, onClose }: ColorPickerProps) {
  const actions = useHueStoreActions();
  const [mode, setMode] = useState<ColorMode>(light.hasColor ? 'wheel' : 'temperature');
  const [hueAngle, setHueAngle] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [temperature, setTemperature] = useState(light.colorTemp ?? 300);

  const [isWheelDragging, setIsWheelDragging] = useState(false);
  const [isTempDragging, setIsTempDragging] = useState(false);

  const wheelRef = useRef<HTMLDivElement>(null);
  const tempTrackRef = useRef<HTMLDivElement>(null);
  const processedHardwareInput = useRef<HardwareInputPayload | null>(null);

  const wheelRadius = 110;
  const displayLightness = 100 - (saturation / 2);
  const puckContrastColor = useDynamicContrast(hueAngle, 100, displayLightness);
  const activeTempRange = light.colorTempRange || { min: MIN_MIREK, max: MAX_MIREK };

  useEffect(() => {
    const initialColor = getInitialColorState(light);
    setHueAngle(initialColor.hue);
    setSaturation(initialColor.saturation);
    setTemperature(light.colorTemp ?? 300);
    setMode(light.hasColor ? 'wheel' : 'temperature');
  }, [light]);

  useEffect(() => {
    if (!hardwareInput || processedHardwareInput.current === hardwareInput) return;
    processedHardwareInput.current = hardwareInput;

    if (hardwareInput.mode === 'pressShort' || hardwareInput.mode === 'pressLong') {
      if (hardwareInput.mode === 'pressShort') onClose();
      return;
    }

    const direction = hardwareInput.mode === 'scrollUp' ? 1 : -1;
    if (mode === 'wheel') {
      setHueAngle((prev) => (prev + (direction * 10) + 360) % 360);
    } else {
      setTemperature((prev) => clamp(prev + (direction * 15), activeTempRange.min, activeTempRange.max));
    }
  }, [activeTempRange.max, activeTempRange.min, hardwareInput, mode, onClose]);

  const updateWheelFromPointer = useCallback((event: React.PointerEvent | PointerEvent) => {
    if (!wheelRef.current) return;

    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + (rect.width / 2);
    const centerY = rect.top + (rect.height / 2);
    const px = event.clientX - centerX;
    const py = event.clientY - centerY;
    const distance = clamp(Math.sqrt((px * px) + (py * py)), 0, wheelRadius);
    const angle = Math.atan2(py, px) * (180 / Math.PI);

    setHueAngle((angle + 90 + 360) % 360);
    setSaturation((distance / wheelRadius) * 100);
  }, []);

  const updateTemperatureFromPointer = useCallback((event: React.PointerEvent | PointerEvent) => {
    if (!tempTrackRef.current) return;

    const rect = tempTrackRef.current.getBoundingClientRect();
    const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const nextTemperature = Math.round(activeTempRange.min + (ratio * (activeTempRange.max - activeTempRange.min)));
    setTemperature(nextTemperature);
  }, [activeTempRange.max, activeTempRange.min]);

  useEffect(() => {
    if (!isWheelDragging) return;

    const handlePointerMove = (event: PointerEvent) => updateWheelFromPointer(event);
    const handlePointerUp = () => setIsWheelDragging(false);

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isWheelDragging, updateWheelFromPointer]);

  useEffect(() => {
    if (!isTempDragging) return;

    const handlePointerMove = (event: PointerEvent) => updateTemperatureFromPointer(event);
    const handlePointerUp = () => setIsTempDragging(false);

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isTempDragging, updateTemperatureFromPointer]);

  const handleConfirm = () => {
    const payload = mode === 'wheel'
      ? { lightId: light.id, hue: hueAngle, saturation }
      : { lightId: light.id, temperature };

    actions.setLightColor(payload);
    onClose();
  };

  return (
    <div className="color-picker-fullscreen fade-in" role="dialog" aria-modal="true" aria-labelledby="color-picker-title">
      <div className="glass-shine" />

      <div className="picker-header">
        <button className="close-btn-glass" type="button" onClick={onClose} aria-label="Close color picker">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
        <div className="picker-title-wrap">
          <p className="hue-eyebrow">Light color</p>
          <h2 id="color-picker-title">{light.name}</h2>
        </div>
        <div className="picker-preview" style={{ background: mode === 'wheel' ? `hsl(${hueAngle} 100% ${displayLightness}%)` : 'rgb(255, 220, 174)' }} />
      </div>

      <div className="picker-body">
        {mode === 'wheel' ? (
          <div ref={wheelRef}>
            <ColorWheel
              hueAngle={hueAngle}
              saturation={saturation}
              wheelRadius={wheelRadius}
              displayLightness={displayLightness}
              puckContrastColor={puckContrastColor}
              isDragging={isWheelDragging}
              onPointerDown={(event) => {
                setIsWheelDragging(true);
                updateWheelFromPointer(event);
              }}
            />
          </div>
        ) : (
          <div ref={tempTrackRef} className="picker-temperature-track">
            <TemperatureSlider
              temperature={temperature}
              min={activeTempRange.min}
              max={activeTempRange.max}
              onPointerDown={(event) => {
                setIsTempDragging(true);
                updateTemperatureFromPointer(event);
              }}
            />
          </div>
        )}
      </div>

      <div className="picker-footer">
        <div className="picker-mode-toggle" aria-label="Color mode">
          <button
            type="button"
            disabled={!light.hasColor}
            className={mode === 'wheel' ? 'is-active' : ''}
            onClick={() => light.hasColor && setMode('wheel')}
          >
            Color
          </button>
          <button
            type="button"
            disabled={!light.hasColorTemp}
            className={mode === 'temperature' ? 'is-active' : ''}
            onClick={() => light.hasColorTemp && setMode('temperature')}
          >
            White
          </button>
        </div>
        <button
          type="button"
          className="hue-primary-button"
          onClick={handleConfirm}
        >
          Done
        </button>
      </div>
    </div>
  );
}
