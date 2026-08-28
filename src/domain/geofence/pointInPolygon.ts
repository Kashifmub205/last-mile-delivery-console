import type { Coordinate } from '@/types/location';

const BOUNDARY_COLLINEARITY_EPSILON = 1e-12;

function isPointOnSegment(
  point: Coordinate,
  start: Coordinate,
  end: Coordinate,
): boolean {
  const cross =
    (point.longitude - start.longitude) * (end.latitude - start.latitude) -
    (point.latitude - start.latitude) * (end.longitude - start.longitude);

  if (Math.abs(cross) > BOUNDARY_COLLINEARITY_EPSILON) {
    return false;
  }

  const dot =
    (point.longitude - start.longitude) * (end.longitude - start.longitude) +
    (point.latitude - start.latitude) * (end.latitude - start.latitude);

  if (dot < 0) {
    return false;
  }

  const segmentLengthSquared =
    (end.longitude - start.longitude) ** 2 +
    (end.latitude - start.latitude) ** 2;

  return dot <= segmentLengthSquared;
}

function isPointOnPolygonBoundary(
  point: Coordinate,
  polygon: Coordinate[],
): boolean {
  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];

    if (isPointOnSegment(point, start, end)) {
      return true;
    }
  }

  return false;
}

function rayCastInside(point: Coordinate, polygon: Coordinate[]): boolean {
  let inside = false;

  for (
    let index = 0, previousIndex = polygon.length - 1;
    index < polygon.length;
    previousIndex = index, index += 1
  ) {
    const current = polygon[index];
    const previous = polygon[previousIndex];

    const latitudeCrossesEdge =
      current.latitude > point.latitude !== previous.latitude > point.latitude;

    if (!latitudeCrossesEdge) {
      continue;
    }

    const longitudeOnRay =
      ((previous.longitude - current.longitude) *
        (point.latitude - current.latitude)) /
        (previous.latitude - current.latitude) +
      current.longitude;

    if (point.longitude < longitudeOnRay) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Returns whether a coordinate lies inside the given polygon.
 *
 * Boundary policy: points on any polygon edge or vertex are treated as INSIDE.
 * Interior points use the even-odd ray-casting rule in latitude/longitude space,
 * which is accurate for the small delivery-zone polygons in this app.
 */
export function isCoordinateInsidePolygon(
  point: Coordinate,
  polygon: Coordinate[],
): boolean {
  if (polygon.length < 3) {
    return false;
  }

  if (isPointOnPolygonBoundary(point, polygon)) {
    return true;
  }

  return rayCastInside(point, polygon);
}
