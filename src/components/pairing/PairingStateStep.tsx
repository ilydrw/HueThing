import React from 'react';
import { HueBridgeIcon } from '../HueBridgeIcon';

type PairingStateVariant = 'press-button' | 'success' | 'error';

interface PairingStateStepProps {
  variant: PairingStateVariant;
  logs?: string[];
  message?: string | null;
  onPrimary: () => void;
  onSecondary?: () => void;
}

const glassButtonStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  color: '#fff',
  padding: '12px 18px',
  borderRadius: '15px',
  cursor: 'pointer',
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: '15px',
  fontWeight: 600
};

export function PairingStateStep({
  variant,
  logs = [],
  message,
  onPrimary,
  onSecondary
}: PairingStateStepProps) {
  if (variant === 'press-button') {
    return (
      <>
        <HueBridgeIcon size={80} isSyncing={true} />
        <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, margin: '15px 0 5px' }}>Press Bridge Button</h1>
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '16px', width: '100%', marginBottom: '25px', border: '1px solid rgba(255,255,255,0.05)' }}>
          {logs.map((log, i) => (
            <p key={i} className={`log-item-${i}`} style={{ color: '#34C759', fontSize: '11px', margin: '3px 0', textAlign: 'left', fontFamily: 'monospace' }}>
              {log}
            </p>
          ))}
        </div>
        <button
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '10px 30px', borderRadius: '99px', cursor: 'pointer' }}
          onClick={onPrimary}
        >
          Cancel
        </button>
      </>
    );
  }

  if (variant === 'success') {
    return (
      <>
        <HueBridgeIcon size={80} isSuccess={true} />
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 700, margin: '20px 0 10px' }}>Connected!</h1>
        <button style={{ background: '#34C759', color: '#fff', border: 'none', borderRadius: '99px', padding: '12px 32px', fontWeight: 700, cursor: 'pointer' }} onClick={onPrimary}>
          Launch
        </button>
      </>
    );
  }

  return (
    <>
      <HueBridgeIcon size={80} />
      <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, margin: '18px 0 8px' }}>Connection issue</h1>
      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: 1.5, marginBottom: '18px' }}>
        {message || 'We could not reach or pair with the Hue Bridge.'}
      </p>
      <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
        <button style={glassButtonStyle} onClick={onPrimary}>
          Retry Scan
        </button>
        {onSecondary && (
          <button style={glassButtonStyle} onClick={onSecondary}>
            Manual IP
          </button>
        )}
      </div>
    </>
  );
}
