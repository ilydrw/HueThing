import React from 'react';

interface BrightnessRailProps {
  value: number;
  active: boolean;
  visibleLabel?: boolean;
}

export default function BrightnessRail({ value, active, visibleLabel = true }: BrightnessRailProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      style={{
        position: 'absolute',
        left: '16px',
        right: '16px',
        bottom: active ? '16px' : '14px',
        zIndex: 12,
        transition: 'bottom 220ms ease'
      }}
    >
      {visibleLabel && active && (
        <div
          style={{
            marginBottom: '8px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 8px',
            borderRadius: '999px',
            background: 'rgba(255, 255, 255, 0.16)',
            border: '1px solid rgba(255, 255, 255, 0.22)',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.02em',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)'
          }}
        >
          {Math.round(clamped)}%
        </div>
      )}

      <div
        style={{
          position: 'relative',
          height: active ? '8px' : '2px',
          borderRadius: '999px',
          background: active
            ? 'rgba(255, 255, 255, 0.18)'
            : 'rgba(255, 255, 255, 0.42)',
          overflow: 'visible',
          transition: 'height 220ms ease, background 220ms ease'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: `${clamped}%`,
            borderRadius: '999px',
            background: '#ffffff',
            boxShadow: active ? '0 0 20px rgba(255,255,255,0.45)' : '0 0 10px rgba(255,255,255,0.24)',
            transition: 'width 40ms linear'
          }}
        />

        {active && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: `${clamped}%`,
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: '#fff',
              border: '2px solid rgba(12, 12, 14, 0.18)',
              boxShadow: '0 8px 18px rgba(8, 8, 10, 0.28)',
              transform: 'translate(-50%, -50%)'
            }}
          />
        )}
      </div>
    </div>
  );
}
