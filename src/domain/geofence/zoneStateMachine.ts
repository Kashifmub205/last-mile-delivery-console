import type { Coordinate } from '@/types/location';
import type { ZoneState } from '@/types/zone';

import { processLocationFixForPolygon } from './locationFixProcessing';
import {
  applyEvaluatedObservation,
  createInitialZoneSmoothingState,
  type ZoneObservation,
  type ZoneSmoothingState,
} from './zoneSmoothing';

export type ZoneMachineState = {
  stopId: string;
  zoneState: ZoneState;
  arrivedAt: string | null;
  departedAt: string | null;
  smoothing: ZoneSmoothingState;
  lastAcceptedFix: Coordinate | null;
};

export type ArriveFailureReason = 'not_confirmed_inside';

export type ArriveResult =
  | { ok: true; state: ZoneMachineState }
  | { ok: false; reason: ArriveFailureReason };

export function createInitialZoneMachineState(
  stopId: string,
): ZoneMachineState {
  return {
    stopId,
    zoneState: 'OUTSIDE',
    arrivedAt: null,
    departedAt: null,
    smoothing: createInitialZoneSmoothingState(),
    lastAcceptedFix: null,
  };
}

export function completeStopZone(_state: ZoneMachineState): null {
  return null;
}

function applyConfirmedObservationTransition(
  state: ZoneMachineState,
  previousConfirmed: ZoneObservation | null,
  nextConfirmed: ZoneObservation | null,
  observedAt: string,
): ZoneMachineState {
  if (!nextConfirmed || nextConfirmed === previousConfirmed) {
    return state;
  }

  if (state.zoneState === 'AT_STOP' && nextConfirmed === 'OUTSIDE') {
    return {
      ...state,
      zoneState: 'DEPARTED_EARLY',
      departedAt: observedAt,
    };
  }

  if (state.zoneState === 'DEPARTED_EARLY' && nextConfirmed === 'INSIDE') {
    return {
      ...state,
      zoneState: 'AT_STOP',
      departedAt: null,
    };
  }

  return state;
}

export function applyEvaluatedObservationToZone(
  state: ZoneMachineState,
  inside: boolean,
  observedAt: string,
): ZoneMachineState {
  const previousConfirmed = state.smoothing.confirmedObservation;
  const smoothing = applyEvaluatedObservation(state.smoothing, inside);

  const withSmoothing: ZoneMachineState = {
    ...state,
    smoothing,
  };

  return applyConfirmedObservationTransition(
    withSmoothing,
    previousConfirmed,
    smoothing.confirmedObservation,
    observedAt,
  );
}

export function processLocationFixForZone(
  state: ZoneMachineState,
  polygon: Coordinate[],
  newFix: Coordinate,
  observedAt: string,
): ZoneMachineState {
  const fixResult = processLocationFixForPolygon(
    polygon,
    state.lastAcceptedFix,
    newFix,
  );

  if (fixResult.kind === 'ignored') {
    return state;
  }

  const withAcceptedFix: ZoneMachineState = {
    ...state,
    lastAcceptedFix: newFix,
  };

  return applyEvaluatedObservationToZone(
    withAcceptedFix,
    fixResult.inside,
    observedAt,
  );
}

export function attemptArrive(
  state: ZoneMachineState,
  arrivedAt: string,
): ArriveResult {
  if (state.smoothing.confirmedObservation !== 'INSIDE') {
    return { ok: false, reason: 'not_confirmed_inside' };
  }

  return {
    ok: true,
    state: {
      ...state,
      zoneState: 'AT_STOP',
      arrivedAt,
    },
  };
}
