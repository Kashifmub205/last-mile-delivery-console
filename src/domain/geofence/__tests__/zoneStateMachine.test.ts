import { ROUTE_FIXTURE } from '@/mock/fixtures';
import type { Coordinate } from '@/types/location';

import {
  applyEvaluatedObservationToZone,
  attemptArrive,
  completeStopZone,
  createInitialZoneMachineState,
  processLocationFixForZone,
  type ZoneMachineState,
} from '../zoneStateMachine';

const STOP_ID = 'stop-001';
const INSIDE_AT = '2026-08-28T10:00:00.000Z';
const OUTSIDE_AT = '2026-08-28T10:01:00.000Z';
const RETURN_INSIDE_AT = '2026-08-28T10:02:00.000Z';
const SECOND_DEPARTURE_AT = '2026-08-28T10:03:00.000Z';
const ARRIVED_AT = '2026-08-28T10:04:00.000Z';

function getStopDropZone(stopId: string): Coordinate[] {
  const stop = ROUTE_FIXTURE.stops.find(routeStop => routeStop.id === stopId);

  if (!stop) {
    throw new Error(`Missing stop fixture: ${stopId}`);
  }

  return stop.dropZone;
}

function offsetMetersNorth(coordinate: Coordinate, meters: number): Coordinate {
  return {
    latitude: coordinate.latitude + meters / 111_320,
    longitude: coordinate.longitude,
  };
}

function observeInside(
  state: ZoneMachineState,
  observedAt: string,
): ZoneMachineState {
  return applyEvaluatedObservationToZone(state, true, observedAt);
}

function observeOutside(
  state: ZoneMachineState,
  observedAt: string,
): ZoneMachineState {
  return applyEvaluatedObservationToZone(state, false, observedAt);
}

function confirmInside(state: ZoneMachineState, observedAt: string) {
  return observeInside(observeInside(state, observedAt), observedAt);
}

function confirmOutside(state: ZoneMachineState, observedAt: string) {
  return observeOutside(observeOutside(state, observedAt), observedAt);
}

function arriveAtStop(state: ZoneMachineState): ZoneMachineState {
  const confirmedInside = confirmInside(state, INSIDE_AT);
  const arriveResult = attemptArrive(confirmedInside, ARRIVED_AT);

  if (!arriveResult.ok) {
    throw new Error(`Expected arrive to succeed: ${arriveResult.reason}`);
  }

  return arriveResult.state;
}

describe('zone state machine', () => {
  it('does not flip AT_STOP on one stray outside observation', () => {
    const atStop = arriveAtStop(createInitialZoneMachineState(STOP_ID));

    const afterStrayOutside = observeOutside(atStop, OUTSIDE_AT);

    expect(afterStrayOutside.zoneState).toBe('AT_STOP');
    expect(afterStrayOutside.departedAt).toBeNull();
    expect(afterStrayOutside.smoothing.confirmedObservation).toBe('INSIDE');
  });

  it('confirms outside after two consecutive outside observations', () => {
    const atStop = arriveAtStop(createInitialZoneMachineState(STOP_ID));

    const afterConfirmedOutside = confirmOutside(atStop, OUTSIDE_AT);

    expect(afterConfirmedOutside.smoothing.confirmedObservation).toBe(
      'OUTSIDE',
    );
    expect(afterConfirmedOutside.zoneState).toBe('DEPARTED_EARLY');
  });

  it('fails arrive unless confirmed inside', () => {
    const outsideOnly = observeInside(
      createInitialZoneMachineState(STOP_ID),
      INSIDE_AT,
    );

    const arriveResult = attemptArrive(outsideOnly, ARRIVED_AT);

    expect(arriveResult).toEqual({
      ok: false,
      reason: 'not_confirmed_inside',
    });
  });

  it('succeeds arrive when confirmed inside', () => {
    const confirmedInside = confirmInside(
      createInitialZoneMachineState(STOP_ID),
      INSIDE_AT,
    );

    const arriveResult = attemptArrive(confirmedInside, ARRIVED_AT);

    expect(arriveResult.ok).toBe(true);
    if (arriveResult.ok) {
      expect(arriveResult.state.zoneState).toBe('AT_STOP');
      expect(arriveResult.state.arrivedAt).toBe(ARRIVED_AT);
    }
  });

  it('records departure timestamp on confirmed outside after arrival', () => {
    const atStop = arriveAtStop(createInitialZoneMachineState(STOP_ID));

    const departed = confirmOutside(atStop, OUTSIDE_AT);

    expect(departed.zoneState).toBe('DEPARTED_EARLY');
    expect(departed.departedAt).toBe(OUTSIDE_AT);
  });

  it('does not reset departure timestamp on repeated outside observations', () => {
    const atStop = arriveAtStop(createInitialZoneMachineState(STOP_ID));
    const departed = confirmOutside(atStop, OUTSIDE_AT);
    const stillDeparted = confirmOutside(departed, SECOND_DEPARTURE_AT);

    expect(stillDeparted.zoneState).toBe('DEPARTED_EARLY');
    expect(stillDeparted.departedAt).toBe(OUTSIDE_AT);
  });

  it('returns to AT_STOP and clears departure timestamp on confirmed inside', () => {
    const atStop = arriveAtStop(createInitialZoneMachineState(STOP_ID));
    const departed = confirmOutside(atStop, OUTSIDE_AT);
    const returned = confirmInside(departed, RETURN_INSIDE_AT);

    expect(returned.zoneState).toBe('AT_STOP');
    expect(returned.departedAt).toBeNull();
  });

  it('creates a new departure timestamp when departing again', () => {
    const atStop = arriveAtStop(createInitialZoneMachineState(STOP_ID));
    const firstDeparture = confirmOutside(atStop, OUTSIDE_AT);
    const returned = confirmInside(firstDeparture, RETURN_INSIDE_AT);
    const secondDeparture = confirmOutside(returned, SECOND_DEPARTURE_AT);

    expect(secondDeparture.zoneState).toBe('DEPARTED_EARLY');
    expect(secondDeparture.departedAt).toBe(SECOND_DEPARTURE_AT);
    expect(secondDeparture.departedAt).not.toBe(OUTSIDE_AT);
  });

  it('tears down active geofence state on stop completion', () => {
    const atStop = arriveAtStop(createInitialZoneMachineState(STOP_ID));

    expect(completeStopZone(atStop)).toBeNull();
  });
});

describe('zone smoothing with location fixes', () => {
  const polygon = getStopDropZone(STOP_ID);
  const insideFix: Coordinate = {
    latitude: 33.7209,
    longitude: 73.0651,
  };
  const secondInsideFix = offsetMetersNorth(insideFix, 12);
  const outsideFix = offsetMetersNorth(secondInsideFix, 12);
  const secondOutsideFix = offsetMetersNorth(outsideFix, 12);
  const ignoredNearbyFix: Coordinate = {
    latitude: 33.720905,
    longitude: 73.0651,
  };

  it('does not count ignored fixes toward the consecutive observation threshold', () => {
    let state = createInitialZoneMachineState(STOP_ID);

    state = processLocationFixForZone(
      state,
      polygon,
      insideFix,
      '2026-08-28T10:00:00.000Z',
    );
    expect(state.smoothing.pendingCount).toBe(1);

    state = processLocationFixForZone(
      state,
      polygon,
      ignoredNearbyFix,
      '2026-08-28T10:00:01.000Z',
    );
    expect(state.smoothing.pendingCount).toBe(1);
    expect(state.smoothing.confirmedObservation).toBeNull();

    state = processLocationFixForZone(
      state,
      polygon,
      secondInsideFix,
      '2026-08-28T10:00:02.000Z',
    );
    expect(state.smoothing.pendingCount).toBe(2);
    expect(state.smoothing.confirmedObservation).toBe('INSIDE');

    state = processLocationFixForZone(
      state,
      polygon,
      outsideFix,
      '2026-08-28T10:00:03.000Z',
    );
    expect(state.smoothing.pendingCount).toBe(1);
    expect(state.smoothing.confirmedObservation).toBe('INSIDE');

    state = processLocationFixForZone(
      state,
      polygon,
      secondOutsideFix,
      '2026-08-28T10:00:04.000Z',
    );
    expect(state.smoothing.pendingCount).toBe(2);
    expect(state.smoothing.confirmedObservation).toBe('OUTSIDE');
  });
});
