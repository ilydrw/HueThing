import React from 'react';

interface HueIconProps {
  type?: string;
  className?: string;
  size?: number;
  color?: string;
}

const HueIconsArr = {
  // Standard Bulb (A19/E26)
  bulb: "M16.02,3c2.89,0,5.25,2.5,5.25,4.88c0,0.21-0.04,0.41-0.06,0.61c-0.02,0.19-0.06,0.35-0.1,0.53c-0.82,0.35-2.55,0.74-5.09,0.74s-4.27-0.4-5.09-0.75c-0.04-0.18-0.07-0.34-0.1-0.53c-0.02-0.2-0.06-0.39-0.06-0.61C10.77,5.5,13.13,3,16.02,3z M13.77,17.15c0.78,0.07,1.64,0.1,2.25,0.1c0.61,0,1.47-0.03,2.25-0.1l-0.38,2.33c-0.02,0.16-0.1,0.32-0.23,0.43l-0.35,0.32c-0.02,0.02-0.05,0.04-0.07,0.07l-0.37,0.44C16.75,20.9,16.53,21,16.3,21h-0.55c-0.23,0-0.45-0.1-0.59-0.27l-0.37-0.44c-0.02-0.02-0.04-0.05-0.07-0.07l-0.35-0.32c-0.12-0.11-0.21-0.27-0.23-0.43L13.77,17.15z",
  
  // Lightstrip
  lightstrip: "M9,3H5.2C3.1,3.1,1.5,4.8,1.5,6.9v9.4c0,0.5,0.3,0.8,0.8,0.8h3c0.4,0,0.8-0.3,0.8-0.8V6.8C6,3.8,8.2,3,9,3z M3.6,15.6c-0.5,0-0.8-0.3-0.8-0.8s0.4-0.7,0.8-0.7c0.4,0,0.8,0.3,0.8,0.8C4.5,15.3,4.1,15.6,3.6,15.6z",
  
  // Ceiling / Pendant
  ceiling: "M11,16.84c-3.04-0.09-5.82-0.56-7.75-1.3c-0.4-0.15-0.92-0.4-1.21-0.57c-0.97-0.57-1.47-1.2-1.47-1.87c0-0.15,0.01-0.23,0.05-0.4c0.09-0.36,0.22-0.7,0.39-1.05c0.69-1.41,2-2.54,3.86-3.33c1.55-0.65,3.46-1.06,5.64-1.18",
  
  // Filament / Vintage
  filament: "M15.1,0.85c-0.29,0.04-0.56,0.12-0.82,0.25C13,1.11,11.78,1.59,10.84,2.44c-1.72,1.46-0.97,4.2-0.97,4.2l2.47,9.44c0.12,0.01,0.24,0.02,0.37,0.03h3.5",
  
  // Room / General
  room: "M12,22.09C6.44,22.09,1.91,17.56,1.91,12C1.91,6.44,6.44,1.91,12,1.91c5.56,0,10.09,4.53,10.09,10.09",
  
  // All Lights / Group
  group: "M16.02,3c2.89,0,5.25,2.5,5.25,4.88c0,0.21-0.04,0.41-0.06,0.61M12.55,16.77c-0.01-0.02-0.02-0.04-0.04-0.05c-0.56,0.04-1.14,0.06-1.57,0.06"
};

export const HueIcon: React.FC<HueIconProps> = ({ type = 'bulb', className = '', size = 24, color = 'currentColor' }) => {
  // Simple mapping logic
  let path = HueIconsArr.bulb;
  const lowercaseType = type.toLowerCase();
  
  if (lowercaseType.includes('strip')) path = HueIconsArr.lightstrip;
  else if (lowercaseType.includes('pendant') || lowercaseType.includes('ceiling')) path = HueIconsArr.ceiling;
  else if (lowercaseType.includes('filament')) path = HueIconsArr.filament;
  else if (lowercaseType.includes('room') || lowercaseType.includes('zone')) path = HueIconsArr.room;
  else if (lowercaseType.includes('group') || lowercaseType.includes('all')) path = HueIconsArr.group;
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      className={className}
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  );
};
