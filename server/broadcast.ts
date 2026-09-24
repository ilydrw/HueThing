import { Database } from './db.js';
import { sendHueServerMessage } from './messages.js';
import { EMPTY_HUE_STATE, type HueState } from './hueTypes.js';
import type { HueService } from './hueService.js';

interface BroadcastDependencies {
  hueService: HueService;
  logger: {
    warn: (message: string) => void;
  };
}

export function createBroadcastApi({ hueService, logger }: BroadcastDependencies) {
  const sendFullState = async () => {
    try {
      const state = await hueService.fetchAllData();
      sendHueServerMessage('hueState', state);
    } catch (error) {
      logger.warn(`Failed to fetch Hue state: ${error}`);
      sendHueServerMessage('hueState', EMPTY_HUE_STATE satisfies HueState);
    }
  };

  const sendSyncAreas = async () => {
    if (!hueService.isConfigured()) {
      sendHueServerMessage('syncAreas', []);
      return;
    }

    try {
      const syncAreas = await hueService.getSyncAreas();
      sendHueServerMessage('syncAreas', syncAreas);
    } catch (error) {
      logger.warn(`Failed to fetch sync areas: ${error}`);
      sendHueServerMessage('syncAreas', []);
    }
  };

  const sendDatabaseState = () => {
    sendHueServerMessage('themesList', Database.getThemes());
    sendHueServerMessage('cachedScenesList', Database.getCachedScenes());
  };

  return {
    sendFullState,
    sendSyncAreas,
    sendDatabaseState
  };
}
