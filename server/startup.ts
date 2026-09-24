import { DeskThing } from '@deskthing/server';
import { EventMode, SETTING_TYPES } from '@deskthing/types';
import { sanitizeSavedConfig } from './config.js';
import { sendHueServerMessage } from './messages.js';
import type { ServerAppContext } from './appContext.js';

export function createStartupHandler(context: ServerAppContext) {
  return async function startup() {
    try {
      context.logger.info('startup() called.');

      const savedData = await DeskThing.getData() as Record<string, unknown> | undefined;
      const sanitized = sanitizeSavedConfig(savedData);
      context.runtime.pollMs = sanitized.pollMs;
      context.runtime.knobStep = sanitized.knobStep;

      if (sanitized.bridgeConfig) {
        context.hueService.setConfig(sanitized.bridgeConfig);
      }

      context.sendDatabaseState();

      const actionDefaults = { version: '1.0.0', enabled: true, tag: 'basic' as const };
      DeskThing.registerAction({ id: 'toggleAllLights', name: 'Toggle All Lights', ...actionDefaults });
      DeskThing.registerAction({ id: 'nextScene', name: 'Next Scene', ...actionDefaults });
      DeskThing.registerAction({ id: 'prevScene', name: 'Previous Scene', ...actionDefaults });
      DeskThing.registerAction({ id: 'brightnessUp', name: 'Brightness Up', ...actionDefaults });
      DeskThing.registerAction({ id: 'brightnessDown', name: 'Brightness Down', ...actionDefaults });
      DeskThing.registerAction({ id: 'serverPair', name: '[SERVER] Pair Bridge', ...actionDefaults });

      await DeskThing.initSettings({
        bridgeIp: {
          id: 'bridgeIp',
          type: SETTING_TYPES.STRING,
          label: 'Hue Bridge IP',
          value: context.hueService.getConfig()?.bridgeIp || '',
          description: 'Bridge IP'
        },
        appKey: {
          id: 'appKey',
          type: SETTING_TYPES.STRING,
          label: 'Hue App Key',
          value: context.hueService.getConfig()?.appKey || '',
          description: 'API Username'
        },
        clientKey: {
          id: 'clientKey',
          type: SETTING_TYPES.STRING,
          label: 'Hue Client Key',
          value: context.hueService.getConfig()?.clientKey || '',
          description: 'Entertainment API key'
        },
        pollInterval: {
          id: 'pollInterval',
          type: SETTING_TYPES.RANGE,
          label: 'Refresh (ms)',
          value: context.runtime.pollMs,
          min: 1000,
          max: 30000,
          step: 500
        },
        knobStep: {
          id: 'knobStep',
          type: SETTING_TYPES.RANGE,
          label: 'Knob Step (%)',
          value: context.runtime.knobStep,
          min: 1,
          max: 20,
          step: 1
        }
      });

      DeskThing.registerKey(
        'volumeKnob',
        'HueThing navigation and brightness control',
        [EventMode.ScrollUp, EventMode.ScrollDown, EventMode.PressShort, EventMode.PressLong],
        '1.0.0'
      );

      context.hueService.onUpdate((state) => {
        sendHueServerMessage('hueState', state);
      });

      if (context.hueService.isConfigured()) {
        await context.hueService.startEventStream();
      }

      await context.sendFullState();
      await context.sendSyncAreas();
    } catch (error) {
      context.logger.error(`STARTUP ERROR: ${error}`);
    }
  };
}
