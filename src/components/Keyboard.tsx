import React, { useState, useCallback, useMemo } from 'react';

interface KeyboardProps {
  onInput: (char: string) => void;
  onBackspace: () => void;
  onDone: () => void;
  onClear: () => void;
  title?: string;
  variant?: 'standalone' | 'inline';
}

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'BKSP'],
  ['192.168.', 'DONE'] 
];

export default function Keyboard({ onInput, onBackspace, onDone, onClear, title, variant = 'standalone' }: KeyboardProps) {
  
  const handleKey = useCallback((key: string) => {
    if (key === 'BKSP') {
      onBackspace();
    } else if (key === 'DONE') {
      onDone();
    } else {
      onInput(key);
    }
  }, [onInput, onBackspace, onDone]);

  const isInline = variant === 'inline';

  const containerStyle: React.CSSProperties = isInline ? {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
  } : {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '32px',
    padding: '16px',
    boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
    maxWidth: '340px',
    margin: '0 auto',
  };

  return (
    <div className={`keyboard-glass ${!isInline ? 'fade-in' : ''}`} style={containerStyle}>
      {!isInline && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px', marginBottom: '4px' }}>
          <h2 style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: '18px', fontWeight: 800, letterSpacing: '-0.2px' }}>
            {title || 'Enter IP'}
          </h2>
          <button 
            onClick={onClear} 
            style={{
              background: 'rgba(255, 59, 48, 0.15)',
              border: 'none',
              color: '#FF453A',
              padding: '6px 14px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              outline: 'none',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            Clear
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: isInline ? '6px' : '8px' }}>
        {ROWS.map((row, i) => (
          <div key={`row-${i}`} style={{ display: 'flex', justifyContent: 'center', gap: isInline ? '6px' : '8px' }}>
            {row.map(key => (
              <KeyButton 
                key={key} 
                value={key} 
                onClick={handleKey} 
                isInline={isInline}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function KeyButton({ value, onClick, isInline }: { 
  value: string, 
  onClick: (val: string) => void,
  isInline?: boolean
}) {
  const [isPressed, setIsPressed] = useState(false);

  const label = useMemo(() => {
    if (value === 'BKSP') return '⌫';
    if (value === 'DONE') return 'DONE';
    return value;
  }, [value]);

  const isPreset = value === '192.168.';
  const isDone = value === 'DONE';

  return (
    <button 
      onPointerDown={() => setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      onPointerLeave={() => setIsPressed(false)}
      onClick={() => onClick(value)}
      style={{
        flex: isPreset ? '2.2' : '1',
        height: isInline ? '42px' : '48px',
        
        background: isDone 
          ? (isPressed ? '#0071e3' : '#0088ff')
          : (isPressed 
              ? 'rgba(255, 255, 255, 0.2)' 
              : 'rgba(255, 255, 255, 0.06)'),
        
        border: (isDone || isInline) 
          ? 'none' 
          : '1px solid rgba(255, 255, 255, 0.08)',
              
        borderRadius: isInline ? '14px' : '18px',
        
        color: isDone ? '#fff' : (isPressed ? '#fff' : 'rgba(255,255,255,0.95)'),
        fontSize: isPreset ? '13px' : (isDone ? '14px' : '22px'),
        fontFamily: isPreset ? 'monospace' : 'inherit',
        fontWeight: (isPreset || isDone) ? 800 : 700,
        letterSpacing: isDone ? '1px' : 'normal',
        
        transform: isPressed ? 'scale(0.92)' : 'scale(1)',
        transition: 'all 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: (isPressed || isInline) ? 'none' : '0 4px 12px rgba(0,0,0,0.2)',
        outline: 'none',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  );
}