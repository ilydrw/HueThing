import { useMemo } from 'react';
import { SimplifiedLight, xyToRgb } from '../../types';

export const MIN_MIREK = 153;
export const MAX_MIREK = 500;

export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const hslToRgb = (h: number, s: number, l: number) => {
  const normalizedS = s / 100;
  const normalizedL = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = normalizedS * Math.min(normalizedL, 1 - normalizedL);
  const f = (n: number) => normalizedL - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
};

export const useDynamicContrast = (h: number, s: number, l: number) => {
  return useMemo(() => {
    const [r, g, b] = hslToRgb(h, s, l);
    const linearize = (channel: number) => {
      const scaled = channel / 255;
      return scaled <= 0.04045 ? scaled / 12.92 : Math.pow((scaled + 0.055) / 1.055, 2.4);
    };

    const luminance = (0.2126 * linearize(r)) + (0.7152 * linearize(g)) + (0.0722 * linearize(b));
    return luminance > 0.175 ? '#000000' : '#ffffff';
  }, [h, s, l]);
};

const rgbStringToHueSaturation = (rgbString: string) => {
  const channels = rgbString.match(/\d+/g)?.slice(0, 3).map(Number);
  if (!channels || channels.length !== 3) {
    return { hue: 0, saturation: 100 };
  }

  const [r, g, b] = channels.map((value) => value / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let hue = 0;
  if (delta > 0) {
    if (max === r) {
      hue = ((g - b) / delta) % 6;
    } else if (max === g) {
      hue = ((b - r) / delta) + 2;
    } else {
      hue = ((r - g) / delta) + 4;
    }
    hue *= 60;
    if (hue < 0) hue += 360;
  }

  const lightness = (max + min) / 2;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs((2 * lightness) - 1));

  return {
    hue: Math.round(hue),
    saturation: Math.round(clamp(saturation * 100, 0, 100))
  };
};

export const getInitialColorState = (light: SimplifiedLight) => {
  if (light.colorXY) {
    return rgbStringToHueSaturation(xyToRgb(light.colorXY.x, light.colorXY.y, light.brightness || 100));
  }

  return { hue: 0, saturation: 100 };
};
