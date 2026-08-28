import type { Coordinate } from '@/types/location';
import type { RouteStop } from '@/types/route';

import { processLocationFixForPolygon } from './locationFixProcessing';
import {
  attemptArrive,
  createInitialZoneMachineState,
  processLocationFixForZone,
  type ArriveResult,
  type ZoneMachineState,
} from './zoneStateMachine';

export type IgnoredStopReason = 'no_active_stop' | 'completed_stop';

export type ProcessActiveStopFixResult =
  | { kind: 'ignored_stop'; reason: IgnoredStopReason }
  | { kind: 'fix_ignored'; zone: ZoneMachineState }
  | { kind: 'updated'; zone: ZoneMachineState };

export function ensureZoneStateForStop(
  zone: ZoneMachineState | null,
  stopId: string,
): ZoneMachineState {
  if (!zone || zone.stopId !== stopId) {
    return createInitialZoneMachineState(stopId);
  }

  return zone;
}

export function resolveActiveStopZone(
  zone: ZoneMachineState | null,
  activeStopId: string | null,
  completedStopIds: string[],
): ZoneMachineState | null {
  if (!activeStopId || completedStopIds.includes(activeStopId)) {
    return null;
  }

  return ensureZoneStateForStop(zone, activeStopId);
}

export function processActiveStopLocationFix(
  zone: ZoneMachineState | null,
  activeStop: RouteStop | null,
  completedStopIds: string[],
  fix: Coordinate,
  observedAt: string,
): ProcessActiveStopFixResult {
  if (!activeStop) {
    return { kind: 'ignored_stop', reason: 'no_active_stop' };
  }

  if (completedStopIds.includes(activeStop.id)) {
    return { kind: 'ignored_stop', reason: 'completed_stop' };
  }

  const nextZone = ensureZoneStateForStop(zone, activeStop.id);
  const fixResult = processLocationFixForPolygon(
    activeStop.dropZone,
    nextZone.lastAcceptedFix,
    fix,
  );

  if (fixResult.kind === 'ignored') {
    return { kind: 'fix_ignored', zone: nextZone };
  }

  const updatedZone = processLocationFixForZone(
    nextZone,
    activeStop.dropZone,
    fix,
    observedAt,
  );

  return { kind: 'updated', zone: updatedZone };
}

export function attemptArriveForZone(
  zone: ZoneMachineState | null,
  arrivedAt: string,
): ArriveResult {
  if (!zone) {
    return { ok: false, reason: 'not_confirmed_inside' };
  }

  return attemptArrive(zone, arrivedAt);
}

export function formatElapsedDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}

export function getElapsedSecondsSince(
  isoTimestamp: string | null,
  nowMs: number = Date.now(),
): number {
  if (!isoTimestamp) {
    return 0;
  }

  const startedAt = new Date(isoTimestamp).getTime();
  if (Number.isNaN(startedAt)) {
    return 0;
  }

  return Math.max(0, Math.floor((nowMs - startedAt) / 1000));
}
