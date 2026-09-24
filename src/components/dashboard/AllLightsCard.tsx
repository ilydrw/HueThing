import React from 'react';
import TogglePill from '../TogglePill';

interface AllLightsCardProps {
  anyLightsOn: boolean;
  activeLights: number;
  totalLights: number;
  onToggle: () => void;
  isFocused?: boolean;
}

export default function AllLightsCard({
  anyLightsOn,
  activeLights,
  totalLights,
  onToggle,
  isFocused = false
}: AllLightsCardProps) {
  return (
    <div className={`hue-all-lights ${anyLightsOn ? 'is-on' : ''} ${isFocused ? 'is-focused' : ''}`}>
      <span className="hue-all-lights__icon" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M9 18h6M10 22h4M8.3 15.6A7 7 0 1 1 15.7 15.6C14.7 16.4 14 17 14 18h-4c0-1-.7-1.6-1.7-2.4Z" />
        </svg>
      </span>
      <div>
        <strong>All lights</strong>
        <span>{activeLights} of {totalLights} lights on</span>
      </div>

      <div className="hue-all-lights__spacer" />
      <TogglePill
        checked={anyLightsOn}
        onToggle={onToggle}
        label={anyLightsOn ? 'Turn all lights off' : 'Turn all lights on'}
      />
    </div>
  );
}
