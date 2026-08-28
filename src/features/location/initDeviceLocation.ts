import { AppState, Platform, type AppStateStatus } from 'react-native';

import {
  isDeviceGpsWatcherActive,
  startDeviceGpsWatcher,
  stopDeviceGpsWatcher,
} from './deviceGpsWatcher';
import {
  checkForegroundLocationPermission,
  requestForegroundLocationPermission,
  type LocationPermissionStatus,
} from './locationPermission';

export type { LocationPermissionStatus } from './locationPermission';

let started = false;
let permissionStatus: LocationPermissionStatus = 'checking';
let hasRequestedPermission = false;
let appStateSubscription: ReturnType<typeof AppState.addEventListener> | null =
  null;
let currentAppState: AppStateStatus = AppState.currentState;

const listeners = new Set<(status: LocationPermissionStatus) => void>();

function notifyListeners(): void {
  for (const listener of listeners) {
    listener(permissionStatus);
  }
}

function setPermissionStatus(status: LocationPermissionStatus): void {
  if (permissionStatus === status) {
    return;
  }

  permissionStatus = status;
  notifyListeners();
}

function handlePermissionDenied(): void {
  stopDeviceGpsWatcher();
  setPermissionStatus('denied');
}

async function applyGrantedPermission(): Promise<void> {
  setPermissionStatus('granted');

  if (!isDeviceGpsWatcherActive()) {
    startDeviceGpsWatcher(handlePermissionDenied);
  }
}

async function syncPermissionAndWatcher(options: {
  requestIfNeeded: boolean;
}): Promise<void> {
  if (Platform.OS !== 'android') {
    stopDeviceGpsWatcher();
    setPermissionStatus('unavailable');
    return;
  }

  const granted = await checkForegroundLocationPermission();

  if (granted) {
    await applyGrantedPermission();
    return;
  }

  stopDeviceGpsWatcher();

  if (options.requestIfNeeded && !hasRequestedPermission) {
    hasRequestedPermission = true;
    setPermissionStatus('checking');

    const requestGranted = await requestForegroundLocationPermission();

    if (requestGranted) {
      await applyGrantedPermission();
      return;
    }

    setPermissionStatus('denied');
    return;
  }

  setPermissionStatus('denied');
}

function isForegroundState(state: AppStateStatus): boolean {
  return state === 'active';
}

function handleAppStateChange(nextState: AppStateStatus): void {
  if (!isForegroundState(currentAppState) && isForegroundState(nextState)) {
    void syncPermissionAndWatcher({ requestIfNeeded: false });
  }

  currentAppState = nextState;
}

export function getDeviceLocationPermissionStatus(): LocationPermissionStatus {
  return permissionStatus;
}

export function subscribeDeviceLocationPermission(
  listener: (status: LocationPermissionStatus) => void,
): () => void {
  listeners.add(listener);
  listener(permissionStatus);

  return () => {
    listeners.delete(listener);
  };
}

export function initDeviceLocation(): void {
  if (started) {
    return;
  }

  started = true;
  appStateSubscription = AppState.addEventListener(
    'change',
    handleAppStateChange,
  );

  void syncPermissionAndWatcher({ requestIfNeeded: true });
}

export function teardownDeviceLocation(): void {
  appStateSubscription?.remove();
  appStateSubscription = null;
  stopDeviceGpsWatcher();
  listeners.clear();
  started = false;
  hasRequestedPermission = false;
  permissionStatus = 'checking';
  currentAppState = AppState.currentState;
}
