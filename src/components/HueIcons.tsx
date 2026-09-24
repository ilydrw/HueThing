import React, { useMemo } from 'react';
import { DevicePaths } from '../icons/device-icons';

interface HueIconProps extends Omit<React.SVGProps<SVGSVGElement>, 'type'> {
  type?: string;
  size?: number | string;
}

/**
 * Fuzzy Matching Engine
 * Prioritizes exact matches, then relies on keyword mapping for API strings.
 */
function resolveIconPath(rawType: string): string {
  if (!rawType) return DevicePaths['color_bulb'];

  const normalized = rawType.toLowerCase().trim();

  // 1. O(1) Exact Match Check (Fastest)
  if (DevicePaths[normalized]) {
    return DevicePaths[normalized];
  }

  // 2. Shorthand aliases used by internal components
  const shorthandMap: Record<string, string> = {
    'room': 'living_room',
    'bulb': 'color_bulb',
    'power': 'smart_button',
  };
  if (shorthandMap[normalized]) {
    return DevicePaths[shorthandMap[normalized]];
  }

  // 3. Keyword Resolution (Ordered by specificity)
  const keywordMap: Record<string, string> = {
    'strip': 'lightstrip',
    'play': 'play_bar',
    'tube': 'gradient_tube',
    'bloom': 'bloom',
    'go': 'go_portable',
    'spot': 'gu10_spot',
    'downlight': 'recessed_downlight',
    'recessed': 'recessed_downlight',
    'pendant': 'pendant',
    'ceiling': 'ceiling_fixture',
    'floor': 'floor_lamp',
    'motion': 'motion_sensor',
    'contact': 'contact_sensor',
    'dimmer': 'dimmer_switch',
    'button': 'smart_button',
    'module': 'wall_module',
    'color': 'color_bulb',
    'white': 'white_bulb',
  };

  for (const [keyword, mappedKey] of Object.entries(keywordMap)) {
    if (normalized.includes(keyword)) {
      return DevicePaths[mappedKey];
    }
  }

  // 4. Graceful Degradation
  return DevicePaths['color_bulb'];
}

export const HueIcon: React.FC<HueIconProps> = ({
  type = 'color_bulb',
  size = 24,
  color = 'currentColor',
  className = '',
  ...rest
}) => {
  const path = useMemo(() => resolveIconPath(type), [type]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`hue-icon ${className}`.trim()}
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={!rest['aria-label']}
      {...rest}
    >
      <path d={path} />
    </svg>
  );
};
