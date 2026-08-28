import { GEOFENCE_MIN_DISTANCE_METERS } from '@/constants/geofence';
import type { Coordinate } from '@/types/location';

import { distanceBetweenCoordinates } from './distance';
import { isCoordinateInsidePolygon } from './pointInPolygon';

export type IgnoredLocationFix = {
  kind: 'ignored';
  distanceMeters: number;
};

export type EvaluatedLocationFix = {
  kind: 'evaluated';
  inside: boolean;
  distanceMeters: number;
};

export type LocationFixProcessingResult =
  | IgnoredLocationFix
  | EvaluatedLocationFix;

export function shouldEvaluateZoneForFix(
  lastAcceptedFix: Coordinate | null,
  newFix: Coordinate,
  minDistanceMeters: number = GEOFENCE_MIN_DISTANCE_METERS,
): boolean {
  if (!lastAcceptedFix) {
    return true;
  }

  const distanceMeters = distanceBetweenCoordinates(lastAcceptedFix, newFix);
  return distanceMeters >= minDistanceMeters;
}

export function processLocationFixForPolygon(
  polygon: Coordinate[],
  lastAcceptedFix: Coordinate | null,
  newFix: Coordinate,
  minDistanceMeters: number = GEOFENCE_MIN_DISTANCE_METERS,
): LocationFixProcessingResult {
  const distanceMeters = lastAcceptedFix
    ? distanceBetweenCoordinates(lastAcceptedFix, newFix)
    : 0;

  if (lastAcceptedFix && distanceMeters < minDistanceMeters) {
    return {
      kind: 'ignored',
      distanceMeters,
    };
  }

  return {
    kind: 'evaluated',
    inside: isCoordinateInsidePolygon(newFix, polygon),
    distanceMeters,
  };
}
