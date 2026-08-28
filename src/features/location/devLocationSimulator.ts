import {
  getConfirmingInsideCoordinate,
  getConfirmingOutsideCoordinate,
  getJitterCoordinate,
  getRepresentativeInsideCoordinate,
  getRepresentativeOutsideCoordinate,
} from '@/domain/geofence/polygonCoordinates';
import { findActiveStop } from '@/domain/route/routeProgress';
import { useActiveStopZoneStore } from '@/features/route/store/activeStopZoneStore';
import { useRouteProgressStore } from '@/features/route/store/routeProgressStore';
import { ROUTE_FIXTURE } from '@/mock/fixtures';
import type { Coordinate } from '@/types/location';
import type { RouteStop } from '@/types/route';

import { processActiveStopFix } from './activeStopLocation';

const routeStops = ROUTE_FIXTURE.stops;

function getActiveStop(): RouteStop | null {
  const activeStopId = useRouteProgressStore.getState().activeStopId;
  return findActiveStop(routeStops, activeStopId);
}

function getLastAcceptedFix(): Coordinate | null {
  return useActiveStopZoneStore.getState().zone?.lastAcceptedFix ?? null;
}

function injectInsideFix(stop: RouteStop, observedAt: string) {
  const inside = getRepresentativeInsideCoordinate(stop.dropZone);
  return processActiveStopFix(inside, observedAt);
}

function injectOutsideFix(stop: RouteStop, observedAt: string) {
  const lastFix = getLastAcceptedFix();
  const outside = lastFix
    ? getConfirmingOutsideCoordinate(stop.dropZone, lastFix)
    : getRepresentativeOutsideCoordinate(stop.dropZone);

  return processActiveStopFix(outside, observedAt);
}

function injectConfirmingFix(stop: RouteStop, observedAt: string) {
  const zone = useActiveStopZoneStore.getState().zone;
  const pending = zone?.smoothing.pendingObservation;
  const lastFix = getLastAcceptedFix();

  if (pending === 'OUTSIDE' && lastFix) {
    return processActiveStopFix(
      getConfirmingOutsideCoordinate(stop.dropZone, lastFix),
      observedAt,
    );
  }

  if (lastFix) {
    return processActiveStopFix(
      getConfirmingInsideCoordinate(stop.dropZone, lastFix),
      observedAt,
    );
  }

  return injectInsideFix(stop, observedAt);
}

export function simulateInsideFix(observedAt?: string) {
  const stop = getActiveStop();
  if (!stop) {
    return null;
  }

  return injectInsideFix(stop, observedAt ?? new Date().toISOString());
}

export function simulateOutsideFix(observedAt?: string) {
  const stop = getActiveStop();
  if (!stop) {
    return null;
  }

  return injectOutsideFix(stop, observedAt ?? new Date().toISOString());
}

export function simulateConfirmingFix(observedAt?: string) {
  const stop = getActiveStop();
  if (!stop) {
    return null;
  }

  return injectConfirmingFix(stop, observedAt ?? new Date().toISOString());
}

export function simulateJitterFix(observedAt?: string) {
  const lastFix = getLastAcceptedFix();
  if (!lastFix) {
    return simulateInsideFix(observedAt);
  }

  return processActiveStopFix(
    getJitterCoordinate(lastFix, 5),
    observedAt ?? new Date().toISOString(),
  );
}

export function simulateDepartSequence(observedAt?: string) {
  const timestamp = observedAt ?? new Date().toISOString();
  simulateOutsideFix(timestamp);
  return simulateConfirmingFix(timestamp);
}

export function simulateReturnInsideSequence(observedAt?: string) {
  const timestamp = observedAt ?? new Date().toISOString();
  simulateInsideFix(timestamp);
  return simulateConfirmingFix(timestamp);
}
