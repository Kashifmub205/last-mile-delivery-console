import { PermissionsAndroid, Platform } from 'react-native';

export type LocationPermissionStatus =
  | 'checking'
  | 'granted'
  | 'denied'
  | 'unavailable';

export async function checkForegroundLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  return PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );
}

export async function requestForegroundLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Location permission',
      message: 'Location is required to detect arrival at delivery stops.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    },
  );

  return result === PermissionsAndroid.RESULTS.GRANTED;
}
