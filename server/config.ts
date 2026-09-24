import type { HueBridgeConfig } from './hueTypes.js';

export interface SanitizedSavedConfig {
  pollMs: number;
  knobStep: number;
  bridgeConfig: HueBridgeConfig | null;
}

const clampInteger = (value: unknown, min: number, max: number, fallback: number) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(max, Math.round(numeric)));
};

const getNonEmptyString = (value: unknown) => {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
};

export function sanitizePollInterval(value: unknown) {
  return clampInteger(value, 1000, 30000, 5000);
}

export function sanitizeKnobStep(value: unknown) {
  return clampInteger(value, 1, 20, 5);
}

export function sanitizeSavedConfig(savedData: Record<string, unknown> | undefined): SanitizedSavedConfig {
  const bridgeIp = getNonEmptyString(savedData?.bridgeIp);
  const appKey = getNonEmptyString(savedData?.appKey);
  const clientKey = getNonEmptyString(savedData?.clientKey);

  return {
    pollMs: sanitizePollInterval(savedData?.pollInterval),
    knobStep: sanitizeKnobStep(savedData?.knobStep),
    bridgeConfig: bridgeIp && appKey
      ? { bridgeIp, appKey, ...(clientKey ? { clientKey } : {}) }
      : null
  };
}

export function clampBrightnessValue(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return undefined;
  return Math.max(1, Math.min(100, Math.round(numeric)));
}
