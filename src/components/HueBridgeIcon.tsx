import React from 'react'

export function HueBridgeIcon({ size = 80, invert = false }: { size?: number, invert?: boolean }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 100 100" 
      width={size} 
      height={size} 
      fill="none" 
      stroke="currentColor"
      style={{ color: invert ? '#fff' : 'inherit' }}
    >
      {/* Outer Bridge Shell */}
      <rect x="10" y="10" width="80" height="80" rx="24" ry="24" strokeWidth="4" strokeLinecap="round"/>
      
      {/* Outer Light Ring groove */}
      <circle cx="50" cy="50" r="28" strokeWidth="1" opacity="0.5"/>
      
      {/* Central Link Button */}
      <circle cx="50" cy="50" r="14" strokeWidth="3" fill="currentColor" fillOpacity="0.1"/>
      
      {/* 3 Indicator LEDs (Power, Network, Cloud) */}
      <circle cx="50" cy="22" r="2" fill="currentColor" stroke="none"/>
      <circle cx="28" cy="22" r="2" fill="currentColor" opacity="0.5" stroke="none"/>
      <circle cx="72" cy="22" r="2" fill="currentColor" opacity="0.5" stroke="none"/>
    </svg>
  )
}
