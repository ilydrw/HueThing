import React from 'react';

interface ColorWheelProps {
  hueAngle: number;
  saturation: number;
  wheelRadius: number;
  displayLightness: number;
  puckContrastColor: string;
  isDragging: boolean;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
}

export function ColorWheel({
  hueAngle,
  saturation,
  wheelRadius,
  displayLightness,
  puckContrastColor,
  isDragging,
  onPointerDown
}: ColorWheelProps) {
  const wheelRadians = (hueAngle - 90) * (Math.PI / 180);
  const wheelDistance = (saturation / 100) * wheelRadius;
  const cursorX = wheelRadius + (wheelDistance * Math.cos(wheelRadians));
  const cursorY = wheelRadius + (wheelDistance * Math.sin(wheelRadians));

  return (
    <div
      onPointerDown={onPointerDown}
      style={{
        width: `${wheelRadius * 2}px`,
        height: `${wheelRadius * 2}px`,
        borderRadius: '50%',
        background: `
          radial-gradient(circle closest-side, #ffffff 0%, transparent 100%),
          conic-gradient(from 90deg, red, magenta, blue, cyan, green, yellow, red)
        `,
        position: 'relative',
        touchAction: 'none',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        cursor: 'crosshair'
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: `${cursorX}px`,
          top: `${cursorY}px`,
          width: '44px',
          height: '44px',
          transform: 'translate(-50%, -50%)',
          backgroundColor: `hsl(${hueAngle}, 100%, ${displayLightness}%)`,
          borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.8)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          transition: isDragging ? 'none' : 'all 0.2s ease-out'
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill={puckContrastColor}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
          <circle cx="12" cy="12" r="4" fill={puckContrastColor} />
        </svg>
      </div>
    </div>
  );
}
