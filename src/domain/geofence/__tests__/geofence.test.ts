import { ROUTE_FIXTURE } from '@/mock/fixtures';
import type { Coordinate } from '@/types/location';

import { distanceBetweenCoordinates } from '../distance';
import {
  processLocationFixForPolygon,
  shouldEvaluateZoneForFix,
} from '../locationFixProcessing';
import { isCoordinateInsidePolygon } from '../pointInPolygon';

function getStopDropZone(stopId: string): Coordinate[] {
  const stop = ROUTE_FIXTURE.stops.find(routeStop => routeStop.id === stopId);

  if (!stop) {
    throw new Error(`Missing stop fixture: ${stopId}`);
  }

  return stop.dropZone;
}

function offsetMetersNorth(coordinate: Coordinate, meters: number): Coordinate {
  const latitudeDelta = meters / 111_320;

  return {
    latitude: coordinate.latitude + latitudeDelta,
    longitude: coordinate.longitude,
  };
}

describe('isCoordinateInsidePolygon', () => {
  const rectangle = getStopDropZone('stop-001');

  it('returns true for a point clearly inside a rectangle', () => {
    expect(
      isCoordinateInsidePolygon(
        { latitude: 33.7209, longitude: 73.0651 },
        rectangle,
      ),
    ).toBe(true);
  });

  it('returns false for a point clearly outside a rectangle', () => {
    expect(
      isCoordinateInsidePolygon(
        { latitude: 33.7212, longitude: 73.0651 },
        rectangle,
      ),
    ).toBe(false);
  });

  it('treats a point on the polygon boundary as inside', () => {
    expect(isCoordinateInsidePolygon(rectangle[0], rectangle)).toBe(true);
    expect(
      isCoordinateInsidePolygon(
        {
          latitude: 33.720925,
          longitude: 73.065,
        },
        rectangle,
      ),
    ).toBe(true);
  });
});

describe('isCoordinateInsidePolygon for stop-003 concave L-shape', () => {
  const lShape = getStopDropZone('stop-003');

  it('returns true for a point inside the left vertical arm', () => {
    expect(
      isCoordinateInsidePolygon(
        { latitude: 33.69265, longitude: 73.0149 },
        lShape,
      ),
    ).toBe(true);
  });

  it('returns true for a point inside the bottom horizontal arm', () => {
    expect(
      isCoordinateInsidePolygon(
        { latitude: 33.69255, longitude: 73.0153 },
        lShape,
      ),
    ).toBe(true);
  });

  it('returns false for a point inside the missing notch area', () => {
    expect(
      isCoordinateInsidePolygon(
        { latitude: 33.69275, longitude: 73.01525 },
        lShape,
      ),
    ).toBe(false);
  });
});

describe('distanceBetweenCoordinates', () => {
  const origin: Coordinate = {
    latitude: 33.7209,
    longitude: 73.0651,
  };

  it('returns a distance below 10 meters for a nearby fix', () => {
    const nearby = offsetMetersNorth(origin, 5);
    expect(distanceBetweenCoordinates(origin, nearby)).toBeLessThan(10);
  });

  it('returns a distance above 10 meters for a farther fix', () => {
    const farther = offsetMetersNorth(origin, 15);
    expect(distanceBetweenCoordinates(origin, farther)).toBeGreaterThan(10);
  });
});

describe('location fix noise filtering', () => {
  const rectangle = getStopDropZone('stop-001');
  const insideFix: Coordinate = {
    latitude: 33.721,
    longitude: 73.065125,
  };
  const outsideNearbyFix: Coordinate = {
    latitude: 33.72106,
    longitude: 73.065125,
  };

  it('does not evaluate a fix below the 10 meter threshold', () => {
    expect(shouldEvaluateZoneForFix(insideFix, outsideNearbyFix)).toBe(false);
  });

  it('evaluates a fix at or above the 10 meter threshold', () => {
    const outsideFarFix = offsetMetersNorth(insideFix, 15);
    expect(shouldEvaluateZoneForFix(insideFix, outsideFarFix)).toBe(true);
  });

  it('ignores a nearby fix so polygon containment is not re-evaluated', () => {
    expect(isCoordinateInsidePolygon(outsideNearbyFix, rectangle)).toBe(false);

    const result = processLocationFixForPolygon(
      rectangle,
      insideFix,
      outsideNearbyFix,
    );

    expect(result).toEqual({
      kind: 'ignored',
      distanceMeters: expect.any(Number),
    });
    expect(result.kind === 'ignored' && result.distanceMeters).toBeLessThan(10);
  });
});
