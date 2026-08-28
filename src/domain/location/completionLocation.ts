import type { Coordinate } from '@/types/location';
import type { RouteStop } from '@/types/route';

/**
 * Prefer the latest accepted GPS/simulated fix when available.
 * Until device GPS is wired, completion falls back to the stop drop-zone
 * reference vertex only when no accepted fix exists yet.
 */
export function resolveCompletionLocation(
  stop: RouteStop,
  latestAcceptedFix: Coordinate | null = null,
): Coordinate {
  if (latestAcceptedFix) {
    return latestAcceptedFix;
  }

  return stop.dropZone[0] ?? { latitude: 0, longitude: 0 };
}
