import { DeskThing } from '@deskthing/server';
import { sanitizeKnobStep, sanitizePollInterval } from '../config.js';
import type { ServerAppContext } from '../appContext.js';

interface SettingsValue {
  value?: unknown;
}

type SettingsPayload = Record<string, SettingsValue | undefined>;

function hasSetting(payload: SettingsPayload | undefined, key: string) {
  return Boolean(payload) && Object.prototype.hasOwnProperty.call(payload, key);
}

function getStringValue(payload: SettingsPayload | undefined, key: string, fallback: string) {
  if (!hasSetting(payload, key)) {
    return fallback;
  }

  const rawValue = payload?.[key]?.value;
  if (typeof rawValue !== 'string') {
    return fallback;
  }

  return rawValue.trim();
}

export function registerSettingsHandlers(context: ServerAppContext) {
  const { hueService, runtime, logger, sendFullState, sendSyncAreas } = context;

  DeskThing.on('settings', async (data: { payload?: SettingsPayload } | undefined) => {
    const settings = data?.payload;
    if (!settings) {
      return;
    }

    const currentConfig = hueService.getConfig();
    const nextBridgeIp = getStringValue(settings, 'bridgeIp', currentConfig?.bridgeIp || '');
    const nextAppKey = getStringValue(settings, 'appKey', currentConfig?.appKey || '');
    const nextClientKey = getStringValue(settings, 'clientKey', currentConfig?.clientKey || '');

    runtime.pollMs = hasSetting(settings, 'pollInterval')
      ? sanitizePollInterval(settings.pollInterval?.value)
      : runtime.pollMs;
    runtime.knobStep = hasSetting(settings, 'knobStep')
      ? sanitizeKnobStep(settings.knobStep?.value)
      : runtime.knobStep;

    const configChanged = (
      hasSetting(settings, 'bridgeIp') ||
      hasSetting(settings, 'appKey') ||
      hasSetting(settings, 'clientKey')
    );

    await DeskThing.saveData({
      bridgeIp: nextBridgeIp,
      appKey: nextAppKey,
      clientKey: nextClientKey || undefined,
      pollInterval: runtime.pollMs,
      knobStep: runtime.knobStep
    });

    if (!configChanged) {
      return;
    }

    hueService.stopEventStream();
    hueService.setConfig({
      bridgeIp: nextBridgeIp,
      appKey: nextAppKey,
      ...(nextClientKey ? { clientKey: nextClientKey } : {})
    });

    if (hueService.isConfigured()) {
      logger.info('DeskThing settings updated; restarting Hue event stream.');
      await hueService.startEventStream();
    } else {
      logger.warn('DeskThing settings no longer contain a complete Hue bridge configuration.');
    }

    await sendSyncAreas();
    await sendFullState();
  });
}
