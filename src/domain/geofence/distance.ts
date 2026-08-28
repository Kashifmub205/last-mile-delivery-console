import type { Coordinate } from '@/types/location';

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function distanceBetweenCoordinates(
  a: Coordinate,
  b: Coordinate,
): number {
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const deltaLat = toRadians(b.latitude - a.latitude);
  const deltaLng = toRadians(b.longitude - a.longitude);

  const sinHalfDeltaLat = Math.sin(deltaLat / 2);
  const sinHalfDeltaLng = Math.sin(deltaLng / 2);

  const haversine =
    sinHalfDeltaLat * sinHalfDeltaLat +
    Math.cos(lat1) * Math.cos(lat2) * sinHalfDeltaLng * sinHalfDeltaLng;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(haversine));
}
