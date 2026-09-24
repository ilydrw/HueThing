import React from 'react';

interface GridProps {
  children: React.ReactNode;
  columns?: number; 
  gap?: string;
}

export const Grid: React.FC<GridProps> = ({ children, columns = 2, gap = '16px' }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: gap,
    padding: '0 24px',
    width: '100%',
  }}>
    {children}
  </div>
);