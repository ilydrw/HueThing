import type { SyncDataUpdate } from '../../shared/messages.js';
import type { ServerAppContext } from '../appContext.js';
import { registerHueClientHandler, sendHueServerMessage } from '../messages.js';

export function registerSyncHandlers(context: ServerAppContext) {
  const { hueService, runtime } = context;

  registerHueClientHandler('getSyncAreas', () => context.sendSyncAreas());

  registerHueClientHandler('startSync', async (payload) => {
    const areaId = payload?.areaId;
    if (!areaId) return;

    const readiness = await hueService.debugSyncReady(areaId);
    if (!readiness.ready) {
      sendHueServerMessage('syncError', { error: readiness.reason || 'Sync is not ready.' });
      return;
    }

    if (runtime.activeSyncAreaId && runtime.activeSyncAreaId !== areaId) {
      hueService.stopSync(runtime.activeSyncAreaId);
    }

    if (await hueService.startSync(areaId)) {
      runtime.activeSyncAreaId = areaId;
      sendHueServerMessage('syncStatus', { active: true, areaId });
      return;
    }

    sendHueServerMessage('syncError', { error: 'Failed to start Hue sync.' });
  });

  registerHueClientHandler('stopSync', (payload) => {
    const areaId = payload?.areaId || runtime.activeSyncAreaId;
    if (!areaId) return;

    hueService.stopSync(areaId);
    runtime.activeSyncAreaId = null;
    sendHueServerMessage('syncStatus', { active: false, areaId: null });
  });

  registerHueClientHandler('syncData', (payload) => {
    const updates = Array.isArray(payload?.updates) ? payload.updates as SyncDataUpdate[] : [];
    if (!runtime.activeSyncAreaId || updates.length === 0) return;

    hueService.sendSyncData(
      updates
        .filter((update) => Number.isFinite(update?.id) && update.id > 0 && update?.color)
        .map((update) => ({
          id: update.id,
          color: {
            r: Number(update.color.r) || 0,
            g: Number(update.color.g) || 0,
            b: Number(update.color.b) || 0
          }
        }))
    );
  });
}
