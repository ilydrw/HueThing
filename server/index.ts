import { DeskThing } from '@deskthing/server';
import { createBroadcastApi } from './broadcast.js';
import type { ServerAppContext } from './appContext.js';
import { createPairingHandlers } from './handlers/pairingHandlers.js';
import { registerControlHandlers } from './handlers/controlHandlers.js';
import { registerSettingsHandlers } from './handlers/settingsHandlers.js';
import { registerSyncHandlers } from './handlers/syncHandlers.js';
import { HueService } from './hueService.js';
import { createLogger } from './logger.js';
import { createRuntimeState } from './runtime.js';
import { createStartupHandler } from './startup.js';

const APP_VERSION = '1.0.0';

const logger = createLogger('server');
const hueService = new HueService();
const runtime = createRuntimeState();
const broadcastApi = createBroadcastApi({ hueService, logger });

const context: ServerAppContext = {
  hueService,
  runtime,
  logger,
  ...broadcastApi
};

const startup = createStartupHandler(context);
const pairingHandlers = createPairingHandlers(context);

function teardown() {
  pairingHandlers.stopPairingProcess();

  if (runtime.activeSyncAreaId) {
    hueService.stopSync(runtime.activeSyncAreaId);
    runtime.activeSyncAreaId = null;
  }

  hueService.stopEventStream();
}

logger.info('index.ts module loading...');
logger.info(`VERSION ${APP_VERSION}`);

registerControlHandlers(context, {
  startPairingProcess: pairingHandlers.startPairingProcess
});
registerSettingsHandlers(context);
registerSyncHandlers(context);
pairingHandlers.registerPairingHandlers();

DeskThing.on('start', startup);
DeskThing.on('stop', teardown);
DeskThing.on('purge', teardown);
