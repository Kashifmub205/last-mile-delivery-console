import { GEOFENCE_SMOOTHING_FIX_COUNT } from '@/constants/geofence';

export type ZoneObservation = 'INSIDE' | 'OUTSIDE';

export type ZoneSmoothingState = {
  pendingObservation: ZoneObservation | null;
  pendingCount: number;
  confirmedObservation: ZoneObservation | null;
};

export function createInitialZoneSmoothingState(): ZoneSmoothingState {
  return {
    pendingObservation: null,
    pendingCount: 0,
    confirmedObservation: null,
  };
}

export function applyEvaluatedObservation(
  state: ZoneSmoothingState,
  inside: boolean,
  requiredConsecutiveCount: number = GEOFENCE_SMOOTHING_FIX_COUNT,
): ZoneSmoothingState {
  const observation: ZoneObservation = inside ? 'INSIDE' : 'OUTSIDE';

  if (state.pendingObservation !== observation) {
    return {
      ...state,
      pendingObservation: observation,
      pendingCount: 1,
    };
  }

  const pendingCount = state.pendingCount + 1;

  if (pendingCount >= requiredConsecutiveCount) {
    return {
      pendingObservation: observation,
      pendingCount,
      confirmedObservation: observation,
    };
  }

  return {
    ...state,
    pendingCount,
  };
}
