import React from 'react';
import { theme } from '../../theme';

interface HybridGridProps {
  children: React.ReactNode[]; // Expects exactly 9 children for this specific mode
}

export const HybridGrid: React.FC<HybridGridProps> = ({ children }) => {
  return (
    <div style={{
      display: 'grid',
      width: '800px',
      height: '400px', // Leaving 80px for header/clock
      padding: '0 24px 20px',
      gap: '12px',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gridTemplateRows: 'repeat(3, 1fr)',
      gridTemplateAreas: `
        "top1 top1 top2 top2"
        "mid1 mid2 mid3 mid4"
        "bot1 bot1 bot1 bot1"
      `,
    }}>
      {/* Primary Row (2x2) */}
      <div style={{ gridArea: 'top1' }}>{children[0]}</div>
      <div style={{ gridArea: 'top2' }}>{children[1]}</div>

      {/* Secondary Row (4x1) */}
      <div style={{ gridArea: 'mid1' }}>{children[2]}</div>
      <div style={{ gridArea: 'mid2' }}>{children[3]}</div>
      <div style={{ gridArea: 'mid3' }}>{children[4]}</div>
      <div style={{ gridArea: 'mid4' }}>{children[5]}</div>

      {/* Utility Bar (Full Width) */}
      <div style={{ gridArea: 'bot1' }}>{children[6]}</div>
    </div>
  );
};