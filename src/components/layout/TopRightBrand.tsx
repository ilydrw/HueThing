import React from 'react';
import Clock from '../Clock';
import { Logo } from '../Logo';
import { carThingLayout } from '../../theme/carThing';

export default function TopRightBrand({ visible }: { visible: boolean }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: `${carThingLayout.brand.top}px`,
        right: `${carThingLayout.brand.right}px`,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: `${carThingLayout.brand.gap}px`,
        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease',
        transform: visible ? 'translateY(0)' : 'translateY(-150%)',
        opacity: visible ? 1 : 0
      }}
    >
      <div
        style={{
          padding: `${carThingLayout.brand.padY}px ${carThingLayout.brand.padX}px`,
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 18px 32px rgba(0, 0, 0, 0.24)'
        }}
      >
        <Logo
          iconSize={carThingLayout.brand.iconSize}
          textSize={carThingLayout.brand.textSize}
          thingClassName="thing-shimmer"
        />
      </div>
      <Clock />
    </div>
  );
}
