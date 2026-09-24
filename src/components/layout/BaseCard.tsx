import React from 'react';
import { theme } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

export const BaseCard: React.FC<CardProps> = ({ children, active, onClick }) => (
  <div 
    onClick={onClick}
    style={{
      background: active ? 'rgba(0, 122, 255, 0.18)' : theme.colors.glass,
      border: `1px solid ${active ? theme.colors.accent : theme.colors.glassBorder}`,
      borderRadius: theme.radius.md,
      backdropFilter: `blur(${theme.blur})`,
      WebkitBackdropFilter: `blur(${theme.blur})`,
      padding: '20px',
      height: '140px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.2s ease',
      outline: 'none', // Kill the blue box
    }}
  >
    {/* Clean internal shine */}
    <div style={{
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
      background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, transparent 60%)',
      pointerEvents: 'none'
    }} />
    <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
      {children}
    </div>
  </div>
);