import { GEOFENCE_MIN_DISTANCE_METERS } from '@/constants/geofence';
import { distanceBetweenCoordinates } from '@/domain/geofence/distance';
import { isCoordinateInsidePolygon } from '@/domain/geofence/pointInPolygon';
import {
  getConfirmingInsideCoordinate,
  getConfirmingOutsideCoordinate,
  getJitterCoordinate,
  getRepresentativeInsideCoordinate,
  getRepresentativeOutsideCoordinate,
} from '@/domain/geofence/polygonCoordinates';
import { ROUTE_FIXTURE } from '@/mock/fixtures';

describe('simulator polygon coordinates', () => {
  it.each(ROUTE_FIXTURE.stops.map(stop => [stop.id, stop.dropZone] as const))(
    'generates valid simulator coordinates for %s',
    (_stopId, polygon) => {
      const inside = getRepresentativeInsideCoordinate(polygon);
      const outside = getRepresentativeOutsideCoordinate(polygon);
      const confirmingInside = getConfirmingInsideCoordinate(polygon, inside);
      const confirmingOutside = getConfirmingOutsideCoordinate(
        polygon,
        outside,
      );
      const outsideFromInside = getConfirmingOutsideCoordinate(polygon, inside);
      const jitter = getJitterCoordinate(inside);

      expect(isCoordinateInsidePolygon(inside, polygon)).toBe(true);
      expect(isCoordinateInsidePolygon(outside, polygon)).toBe(false);
      expect(
        distanceBetweenCoordinates(inside, outside),
      ).toBeGreaterThanOrEqual(GEOFENCE_MIN_DISTANCE_METERS);

      expect(isCoordinateInsidePolygon(confirmingInside, polygon)).toBe(true);
      expect(
        distanceBetweenCoordinates(inside, confirmingInside),
      ).toBeGreaterThanOrEqual(GEOFENCE_MIN_DISTANCE_METERS);

      expect(isCoordinateInsidePolygon(confirmingOutside, polygon)).toBe(false);
      expect(
        distanceBetweenCoordinates(outside, confirmingOutside),
      ).toBeGreaterThanOrEqual(GEOFENCE_MIN_DISTANCE_METERS);

      expect(isCoordinateInsidePolygon(outsideFromInside, polygon)).toBe(false);
      expect(
        distanceBetweenCoordinates(inside, outsideFromInside),
      ).toBeGreaterThanOrEqual(GEOFENCE_MIN_DISTANCE_METERS);

      expect(distanceBetweenCoordinates(inside, jitter)).toBeLessThan(
        GEOFENCE_MIN_DISTANCE_METERS,
      );
    },
  );
});
