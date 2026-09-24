import type { HueService } from './hueService.js';
import type { AppRuntimeState } from './runtime.js';

export interface ServerAppContext {
  hueService: HueService;
  runtime: AppRuntimeState;
  logger: {
    info: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string) => void;
  };
  sendFullState: () => Promise<void>;
  sendSyncAreas: () => Promise<void>;
  sendDatabaseState: () => void;
}
