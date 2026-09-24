import React, { useState, useCallback, useMemo } from 'react'

interface FullKeyboardProps {
  onInput: (char: string) => void
  onBackspace: () => void
  onDone: () => void
  onClear: () => void
  title?: string
}

const ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['SHIFT', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BKSP'],
  ['#', ',', 'SPACE', '.', 'DONE']
];

export default function FullKeyboard({ onInput, onBackspace, onDone, onClear, title }: FullKeyboardProps) {
  const [isShift, setIsShift] = useState(true);

  const handleKey = useCallback((key: string) => {
    const actions: Record<string, () => void> = {
      SHIFT: () => setIsShift(prev => !prev),
      BKSP: onBackspace,
      DONE: onDone,
      SPACE: () => onInput(' '),
    };

    if (actions[key]) {
      actions[key]();
    } else {
      onInput(isShift ? key.toUpperCase() : key.toLowerCase());
    }
  }, [isShift, onInput, onBackspace, onDone]);

  return (
    <div 
      className="full-keyboard-container fade-in" 
      style={{
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        borderRadius: '32px',
        padding: '20px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
        maxWidth: '760px',
        margin: '0 auto'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 10px', marginBottom: '8px' }}>
        <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 800, margin: 0 }}>{title || 'Keyboard'}</h2>
        <button 
          onClick={onClear}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: 'none',
            color: 'rgba(255,255,255,0.5)',
            padding: '8px 16px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Clear
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {ROWS.map((row, i) => (
          <div key={`row-${i}`} style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
            {row.map(key => (
              <KeyButton 
                key={key} 
                value={key} 
                isShift={isShift} 
                onClick={handleKey} 
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function KeyButton({ value, isShift, onClick }: { 
  value: string, 
  isShift?: boolean, 
  onClick: (val: string) => void
}) {
  const [isPressed, setIsPressed] = useState(false);

  const label = useMemo(() => {
    if (value === 'BKSP') return '⌫';
    if (value === 'SPACE') return '';
    if (value.length === 1) return isShift ? value.toUpperCase() : value.toLowerCase();
    return value;
  }, [value, isShift]);

  const isSpecial = value.length > 1;
  const isDone = value === 'DONE';
  const isShiftKey = value === 'SHIFT';

  return (
    <button 
      onPointerDown={() => setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      onPointerLeave={() => setIsPressed(false)}
      onClick={() => onClick(value)}
      style={{
        flex: value === 'SPACE' ? '4' : (isSpecial ? '1.5' : '1'),
        height: '48px',
        background: isDone 
          ? '#0088ff' 
          : (isShiftKey && isShift ? '#bf5af2' : (isPressed ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)')),
        border: 'none',
        borderRadius: '14px',
        color: '#fff',
        fontSize: isSpecial ? '13px' : '18px',
        fontWeight: 700,
        cursor: 'pointer',
        transform: isPressed ? 'scale(0.95)' : 'scale(1)',
        transition: 'all 0.1s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        outline: 'none'
      }}
    >
      {label}
    </button>
  );
}