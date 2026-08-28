import { findActiveStop } from '@/domain/route/routeProgress';
import {
  attemptArriveForZone,
  processActiveStopLocationFix,
  resolveActiveStopZone,
  type ProcessActiveStopFixResult,
} from '@/domain/geofence/zoneOrchestration';
import type { ArriveResult } from '@/domain/geofence/zoneStateMachine';
import { useActiveStopZoneStore } from '@/features/route/store/activeStopZoneStore';
import { useRouteProgressStore } from '@/features/route/store/routeProgressStore';
import { ROUTE_FIXTURE } from '@/mock/fixtures';
import type { Coordinate } from '@/types/location';

const routeStops = ROUTE_FIXTURE.stops;

function getActiveRouteContext() {
  const routeState = useRouteProgressStore.getState();

  return {
    activeStop: findActiveStop(routeStops, routeState.activeStopId),
    completedStopIds: routeState.completedStopIds,
  };
}

function applyFixResult(result: ProcessActiveStopFixResult): void {
  if (result.kind === 'updated' || result.kind === 'fix_ignored') {
    useActiveStopZoneStore.getState().setZone(result.zone);
  }
}

export function syncActiveStopZoneWithRoute(): void {
  const routeState = useRouteProgressStore.getState();
  const zoneState = useActiveStopZoneStore.getState();

  if (!routeState.hasHydrated || !zoneState.hasHydrated) {
    return;
  }

  const resolved = resolveActiveStopZone(
    zoneState.zone,
    routeState.activeStopId,
    routeState.completedStopIds,
  );

  if (resolved !== zoneState.zone) {
    zoneState.setZone(resolved);
  }
}

export function processActiveStopFix(
  fix: Coordinate,
  observedAt: string = new Date().toISOString(),
): ProcessActiveStopFixResult {
  const { activeStop, completedStopIds } = getActiveRouteContext();
  const zoneState = useActiveStopZoneStore.getState();

  const result = processActiveStopLocationFix(
    zoneState.zone,
    activeStop,
    completedStopIds,
    fix,
    observedAt,
  );

  applyFixResult(result);
  return result;
}

export function arriveAtActiveStop(
  arrivedAt: string = new Date().toISOString(),
): ArriveResult {
  const zoneState = useActiveStopZoneStore.getState();
  const result = attemptArriveForZone(zoneState.zone, arrivedAt);

  if (result.ok) {
    zoneState.setZone(result.state);
  }

  return result;
}

export function getLatestAcceptedFixForStop(stopId: string): Coordinate | null {
  const zone = useActiveStopZoneStore.getState().zone;

  if (!zone || zone.stopId !== stopId) {
    return null;
  }

  return zone.lastAcceptedFix;
}
