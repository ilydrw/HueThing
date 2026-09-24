import { DeskThing } from '@deskthing/server';
import { registerHueClientHandler, sendHueServerMessage } from '../messages.js';
import type { ServerAppContext } from '../appContext.js';

interface PairingHandlerApi {
  startPairingProcess: (bridgeIp: string) => void;
  stopPairingProcess: () => void;
  registerPairingHandlers: () => void;
}

export function createPairingHandlers(context: ServerAppContext): PairingHandlerApi {
  const { hueService, runtime, logger, sendFullState, sendSyncAreas } = context;
  let pairingGeneration = 0;

  const stopPairingProcess = () => {
    pairingGeneration += 1;
    if (runtime.pairInterval) {
      clearInterval(runtime.pairInterval);
      runtime.pairInterval = null;
    }
  };

  const startPairingProcess = (bridgeIp: string) => {
    if (!bridgeIp) {
      sendHueServerMessage('huePairStatus', { success: false, error: 'Bridge IP is required.' });
      return;
    }

    stopPairingProcess();
    const generation = pairingGeneration;
    let attempts = 0;
    let attemptInFlight = false;
    runtime.pairInterval = setInterval(async () => {
      if (attemptInFlight) return;
      attemptInFlight = true;
      attempts += 1;
      try {
        const result = await hueService.pairBridge(bridgeIp);
        if (generation !== pairingGeneration) return;

        if (result.success) {
          stopPairingProcess();
          await DeskThing.saveData({ bridgeIp, appKey: result.appKey!, clientKey: result.clientKey });
          hueService.setConfig({ bridgeIp, appKey: result.appKey!, clientKey: result.clientKey });
          sendHueServerMessage('huePairStatus', { success: true });
          await hueService.startEventStream();
          await sendSyncAreas();
          await sendFullState();
          return;
        }

        if (result.error?.includes('link button not pressed')) {
          if (attempts >= 15) {
            stopPairingProcess();
            sendHueServerMessage('huePairStatus', { success: false, error: 'Pairing timed out. Please try again.' });
            return;
          }
          if (attempts % 5 === 0) {
            sendHueServerMessage('huePairStatus', { error: 'Please press the bridge button...' });
          }
          return;
        }

        if (result.error) {
          stopPairingProcess();
          sendHueServerMessage('huePairStatus', { success: false, error: result.error });
          return;
        }

        if (attempts >= 15) {
          stopPairingProcess();
          sendHueServerMessage('huePairStatus', { success: false, error: 'Pairing timed out. Please try again.' });
        }
      } finally {
        attemptInFlight = false;
      }
    }, 2000);
  };

  const registerPairingHandlers = () => {
    registerHueClientHandler('discover', async () => {
      logger.info('Manual discovery triggered');
      const bridges = await hueService.discoverBridge();
      sendHueServerMessage('hueDiscoverResult', bridges);
    });

    registerHueClientHandler('pair', (payload) => {
      startPairingProcess(payload?.bridgeIp ?? '');
    });

    registerHueClientHandler('cancelPair', () => {
      stopPairingProcess();
    });
  };

  return {
    startPairingProcess,
    stopPairingProcess,
    registerPairingHandlers
  };
}
