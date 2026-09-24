import React from 'react';

interface TogglePillProps {
  checked: boolean;
  onToggle: () => void;
  label?: string;
  disabled?: boolean;
  compact?: boolean;
}

export default function TogglePill({
  checked,
  onToggle,
  label,
  disabled = false,
  compact = false
}: TogglePillProps) {
  const width = compact ? 54 : 62;
  const height = compact ? 30 : 34;
  const knobSize = compact ? 22 : 26;
  const travel = width - knobSize - 8;

  return (
    <button
      type="button"
      aria-label={label || (checked ? 'Turn off' : 'Turn on')}
      aria-pressed={checked}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerMove={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      disabled={disabled}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        borderRadius: `${height / 2}px`,
        border: '1px solid rgba(255, 255, 255, 0.14)',
        background: checked
          ? 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(243,243,244,0.88))'
          : 'rgba(255, 255, 255, 0.08)',
        boxShadow: checked
          ? 'inset 0 1px 1px rgba(255,255,255,0.65), 0 8px 20px rgba(8,8,10,0.24)'
          : 'inset 0 1px 1px rgba(255,255,255,0.08)',
        padding: 0,
        position: 'relative',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'background 220ms ease, box-shadow 220ms ease, border-color 220ms ease',
        opacity: disabled ? 0.55 : 1,
        outline: 'none'
      }}
    >
      <span
        style={{
          position: 'absolute',
          inset: '3px auto 3px 3px',
          width: `${knobSize}px`,
          height: `${knobSize}px`,
          borderRadius: '50%',
          background: checked ? '#0d0d0f' : '#ffffff',
          boxShadow: checked
            ? '0 4px 12px rgba(8,8,10,0.35)'
            : '0 4px 10px rgba(8,8,10,0.22)',
          transform: `translateX(${checked ? travel : 0}px)`,
          transition: 'transform 220ms cubic-bezier(0.2, 0.9, 0.2, 1.1), background 220ms ease'
        }}
      />
    </button>
  );
}
