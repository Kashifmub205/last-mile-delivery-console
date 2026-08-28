export const StorageKeys = {
  routeProgress: 'route.progress',
  activeStopZone: 'route.activeStopZone',
  outbox: 'sync.outbox',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];
