import React from 'react';

interface TemperatureSliderProps {
  temperature: number;
  min: number;
  max: number;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
}

export function TemperatureSlider({ temperature, min, max, onPointerDown }: TemperatureSliderProps) {
  const tempPercent = ((temperature - min) / (max - min)) * 100;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '18px', alignItems: 'center' }}>
      <div
        onPointerDown={onPointerDown}
        style={{
          width: '100%',
          height: '44px',
          background: 'linear-gradient(to right, #ff9b42, #ffffff, #a3c8ff)',
          borderRadius: '22px',
          position: 'relative',
          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          touchAction: 'none'
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: `${tempPercent}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '34px',
            height: '34px',
            background: '#fff',
            borderRadius: '50%',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}
        />
      </div>
      <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
        {temperature} mirek
      </p>
    </div>
  );
}
