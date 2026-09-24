export interface AppRuntimeState {
  pollMs: number;
  knobStep: number;
  pairInterval: ReturnType<typeof setInterval> | null;
  activeSyncAreaId: string | null;
}

export function createRuntimeState(): AppRuntimeState {
  return {
    pollMs: 5000,
    knobStep: 5,
    pairInterval: null,
    activeSyncAreaId: null
  };
}
