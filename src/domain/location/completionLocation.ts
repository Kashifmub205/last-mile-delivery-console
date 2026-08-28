import type { Coordinate } from '@/types/location';
import type { RouteStop } from '@/types/route';

export function resolveCompletionLocation(
  stop: RouteStop,
  latestAcceptedFix: Coordinate | null = null,
): Coordinate {
  if (latestAcceptedFix) {
    return latestAcceptedFix;
  }

  return stop.dropZone[0] ?? { latitude: 0, longitude: 0 };
}
