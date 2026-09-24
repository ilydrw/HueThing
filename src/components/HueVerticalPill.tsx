import React, { useEffect, useRef, useState } from 'react';
import { HueIcon } from './HueIcons';
import { xyToRgb } from '../types';

interface VerticalPillProps {
  brightness: number;
  colorXY?: { x: number; y: number };
  on: boolean;
  name: string;
  canEditColor?: boolean;
  onToggle: () => void;
  onBrightnessChange: (brightness: number) => void;
  onOpenColor?: () => void;
}

export const HueVerticalPill: React.FC<VerticalPillProps> = ({
  brightness,
  colorXY,
  on,
  name,
  canEditColor = false,
  onToggle,
  onBrightnessChange,
  onOpenColor
}) => {
  const controlRef = useRef<HTMLButtonElement>(null);
  const gestureRef = useRef({ startY: 0, dragging: false });
  const previewRef = useRef(brightness);
  const suppressClickRef = useRef(false);
  const [previewBrightness, setPreviewBrightness] = useState(brightness);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) {
      previewRef.current = brightness;
      setPreviewBrightness(brightness);
    }
  }, [brightness, isDragging]);

  const updateBrightness = (clientY: number) => {
    const rect = controlRef.current?.getBoundingClientRect();
    if (!rect) return;

    const ratio = 1 - ((clientY - rect.top) / rect.height);
    const next = Math.max(1, Math.min(100, Math.round(ratio * 100)));
    previewRef.current = next;
    setPreviewBrightness(next);
  };

  const fillColor = colorXY
    ? xyToRgb(colorXY.x, colorXY.y, previewBrightness)
    : 'rgb(255, 214, 170)';
  const displayBrightness = on || isDragging ? previewBrightness : 0;

  return (
    <div className={`hue-light-control ${on ? 'is-on' : 'is-off'} ${isDragging ? 'is-dragging' : ''}`}>
      <button
        ref={controlRef}
        type="button"
        className="hue-light-control__pill"
        aria-label={`${name}, ${on ? `${Math.round(brightness)} percent` : 'off'}. Tap to toggle or drag to dim.`}
        aria-pressed={on}
        onPointerDown={(event) => {
          gestureRef.current = { startY: event.clientY, dragging: false };
          suppressClickRef.current = false;
          event.currentTarget.setPointerCapture?.(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture?.(event.pointerId)) return;
          if (!gestureRef.current.dragging && Math.abs(event.clientY - gestureRef.current.startY) > 6) {
            gestureRef.current.dragging = true;
            suppressClickRef.current = true;
            setIsDragging(true);
          }
          if (gestureRef.current.dragging) {
            updateBrightness(event.clientY);
          }
        }}
        onPointerUp={(event) => {
          if (gestureRef.current.dragging) {
            updateBrightness(event.clientY);
            onBrightnessChange(previewRef.current);
          }
          setIsDragging(false);
          event.currentTarget.releasePointerCapture?.(event.pointerId);
        }}
        onPointerCancel={() => {
          previewRef.current = brightness;
          setPreviewBrightness(brightness);
          setIsDragging(false);
        }}
        onClick={() => {
          if (suppressClickRef.current) {
            suppressClickRef.current = false;
            return;
          }
          onToggle();
        }}
      >
        <span
          className="hue-light-control__fill"
          style={{ height: `${displayBrightness}%`, background: fillColor, boxShadow: on ? `0 -14px 30px ${fillColor}` : 'none' }}
        />
        <span className="hue-light-control__icon">
          <HueIcon type="bulb" size={20} color="currentColor" />
        </span>
        <span className="hue-light-control__level">{displayBrightness}%</span>
      </button>

      <span className="hue-light-control__name" title={name}>{name}</span>

      {canEditColor && onOpenColor ? (
        <button
          type="button"
          className="hue-light-control__color"
          onClick={onOpenColor}
          aria-label={`Choose a color for ${name}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 3a9 9 0 0 1 0 18M3 12h18" />
          </svg>
          Color
        </button>
      ) : (
        <span className="hue-light-control__color hue-light-control__color--disabled">White</span>
      )}
    </div>
  );
};
