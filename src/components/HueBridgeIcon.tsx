import React from 'react'

interface HueBridgeIconProps {
  size?: number;
  color?: string;
  isSyncing?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  className?: string;
}

export function HueBridgeIcon({ 
  size = 80, 
  color = '#ffffff', 
  isSyncing = false,
  isSuccess = false,
  isError = false,
  className = "" 
}: HueBridgeIconProps) {
  const accentBlue = '#0088ff'
  const errorRed = '#ff3b30'
  const strokeColor = isError ? errorRed : color
  const indicatorColor = isError ? errorRed : accentBlue
  const grooveColor = isError ? errorRed : accentBlue
  
  return (
    <div className={`hue-bridge-wrapper ${className}`} style={{ width: size, height: size, position: 'relative' }}>
      <style>
        {`
          @keyframes breathe {
            0% { opacity: 0.2; r: 12; }
            50% { opacity: 0.8; r: 15; }
            100% { opacity: 0.2; r: 12; }
          }
          .animate-pulse-ring {
            animation: breathe 2s ease-in-out infinite;
            transform-origin: center;
          }
        `}
      </style>
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        stroke={strokeColor}
        role="img"
        aria-labelledby="hue-bridge-title"
      >
        <title id="hue-bridge-title">Philips Hue Bridge</title>
        
        {/* Outer Bridge Shell */}
        <rect x="12" y="12" width="76" height="76" rx="20" ry="20" strokeWidth="4" />
        
        {/* Glow Ring (Only visible when syncing) */}
        {isSyncing && (
          <circle 
            cx="50" cy="50" 
            r="12" 
            fill={indicatorColor} 
            stroke="none"
            className="animate-pulse-ring"
          />
        )}

        {/* Outer Light Ring groove */}
        <circle cx="50" cy="50" r="24" stroke={grooveColor} strokeWidth="1.5" opacity="0.6" />
        
        {/* Central Link Button */}
        <circle 
          cx="50" cy="50" 
          r="12" 
          strokeWidth="3" 
          fill={strokeColor} 
          fillOpacity={isSyncing ? 0.4 : 0.1} 
        />
        
        {/* Indicators */}
        <g fill={indicatorColor} stroke="none">
          <circle cx="42" cy="28" r="2.5" />
          <circle cx="50" cy="28" r="2.5" />
          <circle cx="58" cy="28" r="2.5" />
        </g>

        {/* Success Checkmark Overlay */}
        {isSuccess && (
          <g transform="translate(60, 60)">
            <circle cx="15" cy="15" r="18" fill="var(--accent-green)" stroke="none" />
            <path 
              d="M7 15l5 5 10-10" 
              stroke="white" 
              strokeWidth="4" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          </g>
        )}

        {/* Error X Overlay */}
        {isError && (
          <g transform="translate(60, 60)">
            <circle cx="15" cy="15" r="18" fill={errorRed} stroke="none" />
            <path 
              d="M10 10l10 10M20 10l-10 10" 
              stroke="white" 
              strokeWidth="4" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          </g>
        )}
      </svg>
    </div>
  )
}
