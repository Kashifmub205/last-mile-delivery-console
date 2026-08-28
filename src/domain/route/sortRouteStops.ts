import type { RouteStop } from '@/types/route';

export function sortRouteStops(stops: RouteStop[]): RouteStop[] {
  return [...stops].sort((a, b) => a.sequence - b.sequence);
}
