import React from 'react';
import { WifiSignal } from './PairingShell';

const glassButtonStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  color: '#fff',
  padding: '12px 18px',
  borderRadius: '15px',
  cursor: 'pointer',
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '15px',
  fontWeight: 600
};

interface DiscoverBridgeStepProps {
  bridgeIp?: string;
  bridges: string[];
  isSearching: boolean;
  logs: string[];
  onRetry: () => void;
  onManual: () => void;
  onConnect: (ip: string) => void;
}

export function DiscoverBridgeStep({
  bridgeIp,
  bridges,
  isSearching,
  logs,
  onRetry,
  onManual,
  onConnect
}: DiscoverBridgeStepProps) {
  return (
    <>
      <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 700 }}>
        <span className="glimmer-sync">Searching for bridge</span>
        <span className="dot-box">
          <span className="dot dot-1" />
          <span className="dot dot-2" />
          <span className="dot dot-3" />
        </span>
      </h1>

      <WifiSignal searching={isSearching} foundNone={!isSearching && bridges.length === 0} />

      <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '13px', margin: '0 0 10px 0', fontWeight: 500 }}>
        {bridgeIp ? `Previous bridge: ${bridgeIp}` : 'Checking local network...'}
      </p>

      <div style={{ minHeight: '65px', marginBottom: '15px' }}>
        {logs.map((log, i) => (
          <p key={i} className={`log-item-${i}`} style={{ color: '#fff', fontSize: '12px', margin: '2px 0', fontFamily: 'monospace', textAlign: 'center' }}>
            {log}
          </p>
        ))}
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {bridges.map((ip) => (
          <button key={ip} onClick={() => onConnect(ip)} style={glassButtonStyle}>
            <span>Connect</span>
            <span style={{ opacity: 0.5 }}>{ip}</span>
          </button>
        ))}
        {!isSearching && bridges.length === 0 && (
          <button style={{ ...glassButtonStyle, background: '#007AFF', justifyContent: 'center' }} onClick={onRetry}>
            Retry Scan
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
        <button
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '12px', cursor: 'pointer' }}
          onClick={onManual}
        >
          Configure manually...
        </button>
      </div>
    </>
  );
}
