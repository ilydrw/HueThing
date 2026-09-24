import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GestureArena, TapSliderRecognizer } from '../lib/GestureEngine';
import BrightnessRail from './sliders/BrightnessRail';

function extractFirstColor(color: string) {
  if (!color.includes('gradient')) {
    return color;
  }

  return (color.match(/rgb\(.*?\)|rgba\(.*?\)/) || [])[0] || color;
}

function getPerceptualLuminance(color: string): number {
  const firstColor = extractFirstColor(color);
  const matches = firstColor.match(/\d+/g);
  if (!matches) {
    return 0;
  }

  const [r, g, b] = matches.map(Number);
  return (0.299 * r) + (0.587 * g) + (0.114 * b);
}

interface HueSliderViewProps {
  value: number;
  color: string;
  onChange: (value: number) => void;
  onCommit: (value: number) => void;
  onClick?: () => void;
  onLongPress?: () => void;
  className?: string;
  children?: React.ReactNode;
  actionLayer?: React.ReactNode;
  style?: React.CSSProperties;
}

export const HueSliderView: React.FC<HueSliderViewProps> = ({
  value,
  color,
  onChange,
  onCommit,
  onClick,
  onLongPress,
  className = '',
  children,
  actionLayer,
  style
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const localValueRef = useRef(value);

  const [isDarkText, setIsDarkText] = useState(false);
  const lastLuminance = useRef(128);
  const initialValueRef = useRef(value);

  useEffect(() => {
    localValueRef.current = localValue;
  }, [localValue]);

  useEffect(() => {
    if (!isInteracting) {
      setLocalValue(value);
      localValueRef.current = value;
    }
  }, [value, isInteracting]);

  useEffect(() => {
    const luminance = getPerceptualLuminance(color);
    if (Math.abs(luminance - lastLuminance.current) > 4) {
      const threshold = 128;
      if (luminance >= threshold + 4) {
        setIsDarkText(true);
      } else if (luminance <= threshold - 4) {
        setIsDarkText(false);
      }
      lastLuminance.current = luminance;
    }
  }, [color]);

  const arena = useMemo(() => {
    return new GestureArena().addRecognizer(new TapSliderRecognizer({
      onTap: () => {
        if (onClick) {
          onClick();
        }
      },
      onSliderStart: () => {
        initialValueRef.current = localValueRef.current;
        setIsInteracting(true);
      },
      onSliderUpdate: (dx: number) => {
        const width = containerRef.current?.offsetWidth || 400;
        const nextValue = Math.max(0, Math.min(100, initialValueRef.current + (dx / width) * 100));
        localValueRef.current = nextValue;
        setLocalValue(nextValue);
        onChange(nextValue);
      },
      onSliderEnd: () => {
        setIsInteracting(false);
        onCommit(localValueRef.current);
      },
      onSliderCancel: () => {
        setIsInteracting(false);
        localValueRef.current = value;
        setLocalValue(value);
      }
    }));
  }, [onChange, onClick, onCommit, value]);

  const handlePointer = (event: React.PointerEvent) => {
    arena.handleEvent(event.nativeEvent, event.currentTarget as HTMLDivElement);
  };

  const textColor = isDarkText ? '#111114' : '#ffffff';
  const subTextColor = isDarkText ? 'rgba(17,17,20,0.64)' : 'rgba(255,255,255,0.72)';

  return (
    <div
      ref={containerRef}
      className={`hue-slider-synthetic ${className}`.trim()}
      onPointerDown={handlePointer}
      onPointerMove={handlePointer}
      onPointerUp={handlePointer}
      onPointerCancel={handlePointer}
      style={{
        position: 'relative',
        overflow: 'hidden',
        touchAction: 'pan-y',
        background: color,
        transition: 'transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease',
        transform: isInteracting ? 'scale(1.015)' : 'scale(1)',
        ...style
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: isInteracting
            ? 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(8,8,10,0.18))'
            : 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(8,8,10,0.28))'
        }}
      />

      <div
        className="card-content"
        style={{
          color: textColor,
          zIndex: 10,
          position: 'relative',
          height: '100%',
          display: 'flex',
          alignItems: 'stretch',
          pointerEvents: 'auto',
          padding: 0
        }}
      >
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'stretch'
          }}
        >
          <div
            style={{
              width: '100%',
              transform: isInteracting ? 'translateY(-2px)' : 'none',
              transition: 'transform 220ms ease, opacity 220ms ease',
              color: textColor
            }}
          >
            {children}
            <div
              style={{
                position: 'absolute',
                inset: 'auto 0 40px 0',
                padding: '0 22px',
                color: subTextColor,
                fontSize: '13px',
                opacity: isInteracting ? 1 : 0,
                transition: 'opacity 180ms ease'
              }}
            >
              Drag for precise brightness
            </div>
          </div>
        </div>
      </div>

      <BrightnessRail value={localValue} active={isInteracting} />

      {actionLayer && (
        <div
          style={{
            position: 'absolute',
            right: '22px',
            top: '22px',
            zIndex: 30,
            pointerEvents: 'auto'
          }}
        >
          {actionLayer}
        </div>
      )}
    </div>
  );
};
