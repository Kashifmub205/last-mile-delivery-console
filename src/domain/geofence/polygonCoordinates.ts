import { GEOFENCE_MIN_DISTANCE_METERS } from '@/constants/geofence';
import type { Coordinate } from '@/types/location';

import { distanceBetweenCoordinates } from './distance';
import { isCoordinateInsidePolygon } from './pointInPolygon';

const CONFIRMING_FIX_DISTANCE_METERS = 12;
const DEFAULT_JITTER_DISTANCE_METERS = 5;

const OUTSIDE_SEARCH_OFFSETS_METERS: ReadonlyArray<{
  north: number;
  east: number;
}> = [
  { north: 15, east: 0 },
  { north: 30, east: 0 },
  { north: 0, east: 15 },
  { north: 0, east: 30 },
  { north: -15, east: 0 },
  { north: 0, east: -15 },
  { north: 45, east: 0 },
  { north: 30, east: 30 },
  { north: 60, east: 0 },
];

const CONFIRMING_SEARCH_OFFSETS_METERS: ReadonlyArray<{
  north: number;
  east: number;
}> = [
  { north: CONFIRMING_FIX_DISTANCE_METERS, east: 0 },
  { north: 0, east: CONFIRMING_FIX_DISTANCE_METERS },
  { north: -CONFIRMING_FIX_DISTANCE_METERS, east: 0 },
  { north: 0, east: -CONFIRMING_FIX_DISTANCE_METERS },
  {
    north: CONFIRMING_FIX_DISTANCE_METERS,
    east: CONFIRMING_FIX_DISTANCE_METERS,
  },
  {
    north: CONFIRMING_FIX_DISTANCE_METERS,
    east: -CONFIRMING_FIX_DISTANCE_METERS,
  },
  { north: 15, east: 0 },
  { north: 0, east: 15 },
  { north: 20, east: 0 },
  { north: 0, east: 20 },
];

export function offsetCoordinateMeters(
  coordinate: Coordinate,
  metersNorth: number,
  metersEast: number = 0,
): Coordinate {
  const latitudeRadians = (coordinate.latitude * Math.PI) / 180;

  return {
    latitude: coordinate.latitude + metersNorth / 111_320,
    longitude:
      coordinate.longitude + metersEast / (111_320 * Math.cos(latitudeRadians)),
  };
}

export function getPolygonCentroid(polygon: Coordinate[]): Coordinate {
  const total = polygon.reduce(
    (accumulator, point) => ({
      latitude: accumulator.latitude + point.latitude,
      longitude: accumulator.longitude + point.longitude,
    }),
    { latitude: 0, longitude: 0 },
  );

  return {
    latitude: total.latitude / polygon.length,
    longitude: total.longitude / polygon.length,
  };
}

function getEdgeMidpoints(polygon: Coordinate[]): Coordinate[] {
  return polygon.map((point, index) => {
    const next = polygon[(index + 1) % polygon.length];

    return {
      latitude: (point.latitude + next.latitude) / 2,
      longitude: (point.longitude + next.longitude) / 2,
    };
  });
}

function buildInsideCandidates(polygon: Coordinate[]): Coordinate[] {
  if (polygon.length === 0) {
    return [];
  }

  return [
    getPolygonCentroid(polygon),
    ...polygon,
    ...getEdgeMidpoints(polygon),
  ];
}

export function getRepresentativeInsideCoordinate(
  polygon: Coordinate[],
): Coordinate {
  for (const candidate of buildInsideCandidates(polygon)) {
    if (isCoordinateInsidePolygon(candidate, polygon)) {
      return candidate;
    }
  }

  return polygon[0] ?? { latitude: 0, longitude: 0 };
}

export function getRepresentativeOutsideCoordinate(
  polygon: Coordinate[],
): Coordinate {
  const inside = getRepresentativeInsideCoordinate(polygon);

  for (const offset of OUTSIDE_SEARCH_OFFSETS_METERS) {
    const candidate = offsetCoordinateMeters(inside, offset.north, offset.east);
    const distanceMeters = distanceBetweenCoordinates(inside, candidate);

    if (
      distanceMeters >= GEOFENCE_MIN_DISTANCE_METERS &&
      !isCoordinateInsidePolygon(candidate, polygon)
    ) {
      return candidate;
    }
  }

  for (const distance of [40, 60, 80, 100, 150]) {
    const candidate = offsetCoordinateMeters(inside, distance, 0);

    if (!isCoordinateInsidePolygon(candidate, polygon)) {
      return candidate;
    }
  }

  return offsetCoordinateMeters(inside, 100, 0);
}

function findConfirmingCoordinate(
  polygon: Coordinate[],
  fromFix: Coordinate,
  mustBeInside: boolean,
  minDistanceMeters: number = GEOFENCE_MIN_DISTANCE_METERS,
): Coordinate {
  for (const offset of CONFIRMING_SEARCH_OFFSETS_METERS) {
    const candidate = offsetCoordinateMeters(
      fromFix,
      offset.north,
      offset.east,
    );
    const distanceMeters = distanceBetweenCoordinates(fromFix, candidate);

    if (distanceMeters < minDistanceMeters) {
      continue;
    }

    const inside = isCoordinateInsidePolygon(candidate, polygon);

    if (mustBeInside && inside) {
      return candidate;
    }

    if (!mustBeInside && !inside) {
      return candidate;
    }
  }

  for (const distance of [20, 30, 40, 50, 60, 80, 100]) {
    for (const offset of CONFIRMING_SEARCH_OFFSETS_METERS) {
      const scale = distance / CONFIRMING_FIX_DISTANCE_METERS;
      const candidate = offsetCoordinateMeters(
        fromFix,
        offset.north * scale,
        offset.east * scale,
      );
      const distanceMeters = distanceBetweenCoordinates(fromFix, candidate);

      if (distanceMeters < minDistanceMeters) {
        continue;
      }

      const inside = isCoordinateInsidePolygon(candidate, polygon);

      if (mustBeInside && inside) {
        return candidate;
      }

      if (!mustBeInside && !inside) {
        return candidate;
      }
    }
  }

  if (mustBeInside) {
    return getRepresentativeInsideCoordinate(polygon);
  }

  for (const distance of [40, 60, 80, 100, 150]) {
    const candidate = offsetCoordinateMeters(fromFix, distance, 0);

    if (
      distanceBetweenCoordinates(fromFix, candidate) >= minDistanceMeters &&
      !isCoordinateInsidePolygon(candidate, polygon)
    ) {
      return candidate;
    }
  }

  return offsetCoordinateMeters(fromFix, 100, 0);
}

export function getConfirmingInsideCoordinate(
  polygon: Coordinate[],
  fromFix: Coordinate,
  minDistanceMeters: number = GEOFENCE_MIN_DISTANCE_METERS,
): Coordinate {
  return findConfirmingCoordinate(polygon, fromFix, true, minDistanceMeters);
}

export function getConfirmingOutsideCoordinate(
  polygon: Coordinate[],
  fromFix: Coordinate,
  minDistanceMeters: number = GEOFENCE_MIN_DISTANCE_METERS,
): Coordinate {
  return findConfirmingCoordinate(polygon, fromFix, false, minDistanceMeters);
}

export function getConfirmingOffsetCoordinate(
  coordinate: Coordinate,
  meters: number = CONFIRMING_FIX_DISTANCE_METERS,
): Coordinate {
  return offsetCoordinateMeters(coordinate, meters);
}

export function getJitterCoordinate(
  coordinate: Coordinate,
  meters: number = DEFAULT_JITTER_DISTANCE_METERS,
): Coordinate {
  const cappedMeters = Math.min(meters, GEOFENCE_MIN_DISTANCE_METERS - 1);

  return offsetCoordinateMeters(coordinate, cappedMeters);
}
