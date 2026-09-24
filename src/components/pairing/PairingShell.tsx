import React from 'react';
import { Logo } from '../Logo';

const OrbField = () => (
  <>
    <div
      style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        top: '-50px',
        left: '-100px',
        background: 'radial-gradient(circle, rgba(0, 122, 255, 0.12) 0%, rgba(0, 122, 255, 0) 70%)',
        filter: 'blur(80px)',
        borderRadius: '50%',
        zIndex: 0,
        animation: 'orbDrift 22s infinite ease-in-out'
      }}
    />
    <div
      style={{
        position: 'absolute',
        width: '350px',
        height: '350px',
        top: '60%',
        left: '70%',
        background: 'radial-gradient(circle, rgba(0, 122, 255, 0.12) 0%, rgba(0, 122, 255, 0) 70%)',
        filter: 'blur(80px)',
        borderRadius: '50%',
        zIndex: 0,
        animation: 'orbDrift 18s infinite ease-in-out 2s'
      }}
    />
    <div
      style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        top: '10%',
        left: '60%',
        background: 'radial-gradient(circle, rgba(0, 122, 255, 0.12) 0%, rgba(0, 122, 255, 0) 70%)',
        filter: 'blur(80px)',
        borderRadius: '50%',
        zIndex: 0,
        animation: 'orbDrift 26s infinite ease-in-out 4s'
      }}
    />
  </>
);

export function WifiSignal({ searching, foundNone }: { searching: boolean; foundNone: boolean }) {
  return (
    <div
      style={{
        position: 'relative',
        width: '120px',
        height: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '15px 0'
      }}
    >
      <svg
        width="70"
        height="70"
        viewBox="0 0 24 24"
        fill="none"
        stroke={foundNone ? '#FF3B30' : '#007AFF'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12.55a11 11 0 0 1 14.08 0" style={{ animation: searching ? 'pulseWave 3s infinite 0.3s' : 'none', opacity: searching ? 0 : 1 }} />
        <path d="M1.42 9a16 16 0 0 1 21.16 0" style={{ animation: searching ? 'pulseWave 3s infinite 0.6s' : 'none', opacity: searching ? 0 : 1 }} />
        <path d="M8.59 16.11a6 6 0 0 1 6.82 0" style={{ animation: searching ? 'pulseWave 3s infinite' : 'none', opacity: searching ? 0 : 1 }} />
        <circle cx="12" cy="20" r="1" fill={foundNone ? '#FF3B30' : '#007AFF'} stroke="none" />
        {foundNone && <line x1="1" y1="1" x2="23" y2="23" stroke="#FF3B30" strokeWidth="2" />}
      </svg>
      <style>{`
        @keyframes orbDrift { 0%, 100% { transform: translate(0, 0); } 33% { transform: translate(50px, -70px); } 66% { transform: translate(-40px, 40px); } }
        @keyframes pulseWave { 0% { opacity: 0; transform: scale(0.9); } 50% { opacity: 0.6; } 100% { opacity: 0; transform: scale(1.1); } }
        @keyframes dotRhythm { 0%, 30%, 100% { transform: translateY(0); } 15% { transform: translateY(-9px); } }
        @keyframes textGlimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .glimmer-sync {
          background: linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.3) 50%, #fff 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: textGlimmer 6s linear infinite;
          display: inline-block;
        }
        .logo-glimmer {
          mask-image: linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.4) 50%, #fff 100%);
          mask-size: 200% auto;
          animation: textGlimmer 6s linear infinite;
        }
        .dot-box { display: inline-flex; width: 44px; justify-content: space-between; margin-left: 12px; vertical-align: middle; }
        .dot { width: 6px; height: 6px; background: currentColor; border-radius: 50%; animation: dotRhythm 2.2s infinite cubic-bezier(0.4, 0, 0.2, 1); }
        .dot-1 { animation-delay: 0s; }
        .dot-2 { animation-delay: 0.25s; }
        .dot-3 { animation-delay: 0.5s; }
        .log-item-2 { opacity: 1 !important; }
        .log-item-1 { opacity: 0.6 !important; }
        .log-item-0 { opacity: 0.3 !important; }
      `}</style>
    </div>
  );
}

export function PairingShell({
  children,
  alignment = 'center'
}: {
  children: React.ReactNode;
  alignment?: 'center' | 'flex-start';
}) {
  return (
    <div
      className="hue-pairing-shell no-scrollbar"
      style={{
        height: '100%',
        width: '100%',
        background: 'radial-gradient(circle at center, rgba(40, 45, 55, 1) 0%, rgba(13, 13, 15, 1) 100%)',
        display: 'flex',
        alignItems: alignment,
        justifyContent: 'center',
        padding: '5px',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <OrbField />
      <div className="logo-glimmer" style={{ position: 'absolute', top: '24px', left: '24px', transform: 'scale(0.6)', transformOrigin: 'top left', zIndex: 100 }}>
        <Logo />
      </div>
      <div
        className="hue-pairing-card"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '28px',
          padding: alignment === 'center' ? '30px' : '5px 15px',
          marginTop: alignment === 'flex-start' ? '5px' : '0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center',
          zIndex: 10
        }}
      >
        {children}
      </div>
    </div>
  );
}
