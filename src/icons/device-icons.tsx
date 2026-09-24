import React from 'react';

/**
 * MASTER DEVICE PATHS
 * To add a new device, simply drop the SVG <path d="..." /> string here.
 * All paths should be optimized for a 24x24 viewBox.
 */
export const DevicePaths: Record<string, string> = {
  // === STANDARD LIGHTING (A19, E26, BR30) ===
  color_bulb: "M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm-1 19c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H11v1z",
  white_bulb: "M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6A4.997 4.997 0 017 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z",
  gu10_spot: "M17 6H7v3h10V6zM8 10h8v4a4 4 0 01-8 0v-4zm-2-6h12v1H6V4zm3 13v3h1v-3H9zm5 0v3h1v-3h-1z",
  recessed_downlight: "M4 14v-2h16v2H4zm8-9c-3.31 0-6 2.69-6 6h12c0-3.31-2.69-6-6-6zM3 16h18v2H3v-2z",

  // === ENTERTAINMENT & AMBIANCE ===
  lightstrip: "M2 11h20v2H2v-2zm2-4h2v2H4V7zm4 0h2v2H8V7zm4 0h2v2h-2V7zm4 0h2v2h-2V7zm4 0h2v2h-2V7z M4 15h2v2H4v-2zm4 0h2v2H8v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z",
  play_bar: "M6 4h12c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm0 2v12h12V6H6zm6 2c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4z",
  gradient_tube: "M4 6h16c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2zm0 2v8h16V8H4z",
  bloom: "M12 22A10 10 0 1012 2a10 10 0 000 20zm0-2a8 8 0 110-16 8 8 0 010 16zm-3-8a3 3 0 106 0 3 3 0 00-6 0z",
  go_portable: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z",

  // === FIXTURES & LAMPS ===
  ceiling_fixture: "M12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zM11 2h2v2h-2z",
  pendant: "M11 2h2v6h-2V2zm-4 7h10l2 6H5l2-6zm1.24 2l-.67 2h8.86l-.67-2H8.24z M9 16h6v2H9v-2z",
  floor_lamp: "M11 2h2v14h-2V2zm-3 15h8v2H8v-2zm-2-12h12l1 4H5l1-4z",

  // === SENSORS & ACCESSORIES ===
  motion_sensor: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z",
  contact_sensor: "M4 6h6v12H4V6zm8 0h8v12h-8V6zm-6 2v8h2V8H6zm8 0v8h4V8h-4z",
  dimmer_switch: "M6 2h12c1.1 0 2 .9 2 2v16c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm0 2v16h12V4H6zm6 2a2 2 0 110 4 2 2 0 010-4zm0 8a2 2 0 110 4 2 2 0 010-4z",
  smart_button: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-12c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z",
  wall_module: "M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h8v2H8V8zm0 4h8v2H8v-2z",

  // === ROOMS & ZONES ===
  living_room: "M20 18v-2h-2v-4a2 2 0 00-2-2H8a2 2 0 00-2 2v4H4v2H3v2h18v-2h-1zm-4-2H8v-4h8v4z M10 6h4v2h-4z",
  bedroom: "M20 9.42V7a2 2 0 00-2-2H6a2 2 0 00-2 2v2.42a2 2 0 00-1.22 1.58L2 14v4h2v-2h16v2h2v-4l-.78-3A2 2 0 0020 9.42zM6 7h12v2H6V7zm13 7H5l.4-1.54a1 1 0 01.96-.76h11.28a1 1 0 01.96.76L19 14z",
  kitchen: "M18 4h-2V2h-2v2H8V2H6v2H4v16h16V4zm-2 14H6V6h10v12z M8 8h6v2H8V8zm0 4h6v2H8v-2z",
  bathroom: "M7 7a2 2 0 110-4 2 2 0 010 4zm14 8V6a2 2 0 00-2-2H9a2 2 0 00-2 2v9H3v2h18v-2h-4zm-4-9h2v7h-2V6z",
  office: "M20 18v-2h-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2v10H4v2H3v2h18v-2h-1zm-4-2H8V6h8v10z M10 8h4v2h-4z",
  outdoor: "M12 3l-8 6v10h16V9l-8-6zm0 2.5l5.5 4.13V17H6.5V9.63L12 5.5z M10 12h4v5h-4z"
};

/**
 * Fallback Component to consume the dictionary directly
 */
export default function DeviceIconProvider({ 
    iconKey, 
    fallbackKey = 'color_bulb',
    ...props 
  }: { 
    iconKey: string;
    fallbackKey?: string;
  } & React.SVGProps<SVGPathElement>) { // <--- The fix
    
    const path = DevicePaths[iconKey] || DevicePaths[fallbackKey] || DevicePaths['color_bulb'];
    return <path d={path} {...props} />;
  }