import Geolocation, {
  type GeoError,
  type GeoPosition,
  PositionError,
} from 'react-native-geolocation-service';

import { processActiveStopFix } from './activeStopLocation';

let watchId: number | null = null;
let onPermissionDenied: (() => void) | null = null;

function handlePosition(position: GeoPosition): void {
  const { latitude, longitude } = position.coords;
  const observedAt = new Date(position.timestamp).toISOString();

  processActiveStopFix({ latitude, longitude }, observedAt);
}

function handleWatchError(error: GeoError): void {
  if (error.code === PositionError.PERMISSION_DENIED) {
    stopDeviceGpsWatcher();
    onPermissionDenied?.();
  }
}

export function startDeviceGpsWatcher(onDenied: () => void): void {
  if (watchId !== null) {
    return;
  }

  onPermissionDenied = onDenied;

  watchId = Geolocation.watchPosition(handlePosition, handleWatchError, {
    enableHighAccuracy: true,
    distanceFilter: 5,
    interval: 5000,
    fastestInterval: 2000,
    showLocationDialog: true,
    accuracy: { android: 'high' },
  });
}

export function stopDeviceGpsWatcher(): void {
  if (watchId !== null) {
    Geolocation.clearWatch(watchId);
    watchId = null;
  }

  onPermissionDenied = null;
}

export function isDeviceGpsWatcherActive(): boolean {
  return watchId !== null;
}
