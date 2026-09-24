import React from 'react';
import Keyboard from '../Keyboard';
import { HueBridgeIcon } from '../HueBridgeIcon';

interface ManualIpStepProps {
  manualIp: string;
  canSubmit: boolean;
  onChange: (updater: (prev: string) => string) => void;
  onBack: () => void;
  onSubmit: () => void;
  onClear: () => void;
}

export function ManualIpStep({
  manualIp,
  canSubmit,
  onChange,
  onBack,
  onSubmit,
  onClear
}: ManualIpStepProps) {
  return (
    <div
      className="fade-in"
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        padding: '5px 0'
      }}
    >
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.5)',
          padding: '12px 20px',
          borderRadius: '20px',
          width: '100%',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ transform: 'scale(0.8)', transformOrigin: 'left center', opacity: 0.6 }}>
          <HueBridgeIcon size={32} />
        </div>
        <span
          style={{
            fontSize: '28px',
            fontFamily: 'monospace',
            fontWeight: 700,
            color: manualIp ? '#fff' : 'rgba(255, 255, 255, 0.15)',
            letterSpacing: '1px'
          }}
        >
          {manualIp || '0.0.0.0'}
        </span>
        <button
          onClick={onClear}
          style={{
            background: 'none',
            border: 'none',
            color: '#FF453A',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer',
            opacity: manualIp ? 1 : 0,
            pointerEvents: manualIp ? 'auto' : 'none'
          }}
        >
          CLEAR
        </button>
      </div>

      <div style={{ width: '100%', maxWidth: '320px' }}>
        <Keyboard
          onInput={(char) => onChange((prev) => prev.length < 15 ? prev + char : prev)}
          onBackspace={() => onChange((prev) => prev.slice(0, -1))}
          onClear={onClear}
          onDone={onSubmit}
          variant="inline"
        />
      </div>

      <div style={{ width: '100%', display: 'flex', gap: '8px', marginTop: '4px' }}>
        <button
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '12px',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
          onClick={onBack}
        >
          BACK
        </button>
        <button
          disabled={!canSubmit}
          style={{
            flex: 2,
            background: canSubmit ? '#0088ff' : 'rgba(255,255,255,0.03)',
            border: 'none',
            borderRadius: '16px',
            padding: '12px',
            color: canSubmit ? '#fff' : 'rgba(255,255,255,0.2)',
            fontSize: '14px',
            fontWeight: 800,
            cursor: canSubmit ? 'pointer' : 'default',
            boxShadow: canSubmit ? '0 4px 15px rgba(0, 136, 255, 0.3)' : 'none',
            transition: 'all 0.3s'
          }}
          onClick={onSubmit}
        >
          CONNECT BRIDGE
        </button>
      </div>
    </div>
  );
}
