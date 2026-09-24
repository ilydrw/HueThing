import React, { useEffect, useState } from 'react';
import { Logo } from './Logo';

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'display' | 'slide' | 'dissolve'>('display');

  useEffect(() => {
    // Timing for Chrome 69 compatibility
    const t1 = setTimeout(() => setPhase('slide'), 1600);
    const t2 = setTimeout(() => setPhase('dissolve'), 2400);
    const t3 = setTimeout(() => onComplete(), 3200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div 
      className={`splash-overlay ${phase === 'dissolve' ? 'curtain-pull' : ''}`} 
      style={{ 
        opacity: phase === 'dissolve' ? 0 : 1, 
        transition: 'opacity 0.8s ease-in-out',
        pointerEvents: 'none'
      }}
    >
      <div style={{
        // Precise Rule of Thirds scaling for 800x480
        transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: phase !== 'display' ? 'translateY(-100vh) scale(1.6)' : 'translateY(0) scale(1.6)',
      }}>
        <Logo />
      </div>
    </div>
  );
}
