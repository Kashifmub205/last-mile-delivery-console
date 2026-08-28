import type { RouteStop, StopStatus } from '@/types/route';
import { sortRouteStops } from './sortRouteStops';

export type RouteProgressSnapshot = {
  activeStopId: string | null;
  completedStopIds: string[];
};

export function createInitialRouteProgress(
  stops: RouteStop[],
): RouteProgressSnapshot {
  const sortedStops = sortRouteStops(stops);

  return {
    activeStopId: sortedStops[0]?.id ?? null,
    completedStopIds: [],
  };
}

export function getStopStatus(
  stopId: string,
  activeStopId: string | null,
  completedStopIds: string[],
): StopStatus {
  if (completedStopIds.includes(stopId)) {
    return 'COMPLETED';
  }

  if (stopId === activeStopId) {
    return 'ACTIVE';
  }

  return 'PENDING';
}

export function completeStopInProgress(
  stops: RouteStop[],
  progress: RouteProgressSnapshot,
  stopId: string,
): RouteProgressSnapshot {
  if (stopId !== progress.activeStopId) {
    return progress;
  }

  if (progress.completedStopIds.includes(stopId)) {
    return progress;
  }

  const sortedStops = sortRouteStops(stops);
  const completedStopIds = [...progress.completedStopIds, stopId];
  const currentIndex = sortedStops.findIndex(stop => stop.id === stopId);
  const nextStop = sortedStops[currentIndex + 1] ?? null;

  return {
    activeStopId: nextStop?.id ?? null,
    completedStopIds,
  };
}

export function findActiveStop(
  stops: RouteStop[],
  activeStopId: string | null,
): RouteStop | null {
  if (!activeStopId) {
    return null;
  }

  return stops.find(stop => stop.id === activeStopId) ?? null;
}
