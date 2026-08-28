import {
  completeStopInProgress,
  type RouteProgressSnapshot,
} from '@/domain/route/routeProgress';
import { sortRouteStops } from '@/domain/route/sortRouteStops';
import type { OutboxDelivery } from '@/types/outbox';
import type { RouteStop } from '@/types/route';

export function reconcileRouteProgressFromOutbox(
  stops: RouteStop[],
  progress: RouteProgressSnapshot,
  deliveries: OutboxDelivery[],
  routeId: string,
): RouteProgressSnapshot {
  const sortedStops = sortRouteStops(stops);
  const stopIds = new Set(sortedStops.map(stop => stop.id));

  const completedFromOutbox = deliveries
    .filter(
      delivery => delivery.routeId === routeId && stopIds.has(delivery.stopId),
    )
    .map(delivery => delivery.stopId);

  const completedStopIds = [
    ...new Set([
      ...progress.completedStopIds.filter(stopId => stopIds.has(stopId)),
      ...completedFromOutbox,
    ]),
  ];

  const nextActiveStop =
    sortedStops.find(stop => !completedStopIds.includes(stop.id)) ?? null;

  return {
    activeStopId: nextActiveStop?.id ?? null,
    completedStopIds,
  };
}

export function routeProgressChanged(
  before: RouteProgressSnapshot,
  after: RouteProgressSnapshot,
): boolean {
  if (before.activeStopId !== after.activeStopId) {
    return true;
  }

  if (before.completedStopIds.length !== after.completedStopIds.length) {
    return true;
  }

  return before.completedStopIds.some(
    stopId => !after.completedStopIds.includes(stopId),
  );
}
