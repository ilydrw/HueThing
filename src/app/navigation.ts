export type AppSurface = 'home' | 'room' | 'sync';

export interface AppRoute {
  surface: AppSurface;
  roomId?: string;
}

export const homeRoute = (): AppRoute => ({ surface: 'home' });

export const roomRoute = (roomId: string): AppRoute => ({
  surface: 'room',
  roomId
});

export const syncRoute = (): AppRoute => ({ surface: 'sync' });

export function isHomeRoute(route: AppRoute) {
  return route.surface === 'home';
}
