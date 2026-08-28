import { ROUTE_FIXTURE } from '@/mock/fixtures';
import type { Coordinate } from '@/types/location';

import {
  getConfirmingInsideCoordinate,
  getConfirmingOutsideCoordinate,
  getJitterCoordinate,
  getRepresentativeInsideCoordinate,
  getRepresentativeOutsideCoordinate,
} from '../polygonCoordinates';
import {
  attemptArriveForZone,
  ensureZoneStateForStop,
  getElapsedSecondsSince,
  processActiveStopLocationFix,
  resolveActiveStopZone,
} from '../zoneOrchestration';
import {
  createInitialZoneMachineState,
  type ZoneMachineState,
} from '../zoneStateMachine';

const STOP_ID = 'stop-001';
const INSIDE_AT = '2026-08-28T10:00:00.000Z';
const OUTSIDE_AT = '2026-08-28T10:01:00.000Z';
const RETURN_INSIDE_AT = '2026-08-28T10:02:00.000Z';
const ARRIVED_AT = '2026-08-28T10:04:00.000Z';

function getStop(stopId: string = STOP_ID) {
  const stop = ROUTE_FIXTURE.stops.find(routeStop => routeStop.id === stopId);

  if (!stop) {
    throw new Error(`Missing stop fixture: ${stopId}`);
  }

  return stop;
}

function applyFix(
  zone: ZoneMachineState | null,
  fix: Coordinate,
  observedAt: string,
) {
  const result = processActiveStopLocationFix(
    zone,
    getStop(),
    [],
    fix,
    observedAt,
  );

  if (result.kind === 'updated' || result.kind === 'fix_ignored') {
    return result.zone;
  }

  return zone;
}

function confirmInside(zone: ZoneMachineState | null, observedAt: string) {
  const stop = getStop();
  const inside = getRepresentativeInsideCoordinate(stop.dropZone);
  const afterFirst = applyFix(zone, inside, observedAt);
  const secondInside = getConfirmingInsideCoordinate(
    stop.dropZone,
    afterFirst?.lastAcceptedFix ?? inside,
  );

  return applyFix(afterFirst, secondInside, observedAt);
}

function confirmOutside(zone: ZoneMachineState | null, observedAt: string) {
  const stop = getStop();
  const fromFix =
    zone?.lastAcceptedFix ?? getRepresentativeInsideCoordinate(stop.dropZone);
  const outside = getConfirmingOutsideCoordinate(stop.dropZone, fromFix);
  const afterFirst = applyFix(zone, outside, observedAt);
  const secondOutside = getConfirmingOutsideCoordinate(
    stop.dropZone,
    afterFirst?.lastAcceptedFix ?? outside,
  );

  return applyFix(afterFirst, secondOutside, observedAt);
}

describe('zone orchestration', () => {
  it('initializes zone state for the active stop', () => {
    const zone = ensureZoneStateForStop(null, STOP_ID);

    expect(zone.stopId).toBe(STOP_ID);
    expect(zone.zoneState).toBe('OUTSIDE');
    expect(zone.lastAcceptedFix).toBeNull();
  });

  it('resets zone state when the active stop changes', () => {
    const existing = createInitialZoneMachineState(STOP_ID);
    const resolved = resolveActiveStopZone(existing, 'stop-002', []);

    expect(resolved?.stopId).toBe('stop-002');
    expect(resolved?.zoneState).toBe('OUTSIDE');
  });

  it('ignores jitter under 10m without changing confirmed observation', () => {
    const stop = getStop();
    const inside = getRepresentativeInsideCoordinate(stop.dropZone);
    const jitter = getJitterCoordinate(inside, 5);

    const afterInside = applyFix(null, inside, INSIDE_AT);
    const afterJitter = applyFix(afterInside, jitter, INSIDE_AT);

    expect(afterJitter?.smoothing.confirmedObservation).toBeNull();
    expect(afterJitter?.lastAcceptedFix).toEqual(inside);
  });

  it('confirms inside after two spaced inside fixes', () => {
    const confirmed = confirmInside(null, INSIDE_AT);

    expect(confirmed?.smoothing.confirmedObservation).toBe('INSIDE');
  });

  it('fails arrive when outside is not confirmed inside', () => {
    const stop = getStop();
    const outside = getRepresentativeOutsideCoordinate(stop.dropZone);
    const zone = applyFix(null, outside, OUTSIDE_AT);

    expect(attemptArriveForZone(zone, ARRIVED_AT)).toEqual({
      ok: false,
      reason: 'not_confirmed_inside',
    });
  });

  it('arrives at stop after confirmed inside', () => {
    const confirmed = confirmInside(null, INSIDE_AT);
    const arriveResult = attemptArriveForZone(confirmed, ARRIVED_AT);

    expect(arriveResult.ok).toBe(true);
    if (arriveResult.ok) {
      expect(arriveResult.state.zoneState).toBe('AT_STOP');
      expect(arriveResult.state.arrivedAt).toBe(ARRIVED_AT);
    }
  });

  it('enters DEPARTED_EARLY after confirmed outside while AT_STOP', () => {
    const confirmed = confirmInside(null, INSIDE_AT);
    const arriveResult = attemptArriveForZone(confirmed, ARRIVED_AT);

    if (!arriveResult.ok) {
      throw new Error('Expected arrive to succeed');
    }

    const departed = confirmOutside(arriveResult.state, OUTSIDE_AT);

    expect(departed?.zoneState).toBe('DEPARTED_EARLY');
    expect(departed?.departedAt).toBe(OUTSIDE_AT);
  });

  it('returns to AT_STOP after confirmed inside return', () => {
    const confirmed = confirmInside(null, INSIDE_AT);
    const arriveResult = attemptArriveForZone(confirmed, ARRIVED_AT);

    if (!arriveResult.ok) {
      throw new Error('Expected arrive to succeed');
    }

    const departed = confirmOutside(arriveResult.state, OUTSIDE_AT);
    const returned = confirmInside(departed, RETURN_INSIDE_AT);

    expect(returned?.zoneState).toBe('AT_STOP');
    expect(returned?.departedAt).toBeNull();
  });

  it('restores elapsed departure duration from persisted departedAt', () => {
    const departedAt = '2026-08-28T10:00:00.000Z';
    const nowMs = new Date('2026-08-28T10:02:30.000Z').getTime();

    expect(getElapsedSecondsSince(departedAt, nowMs)).toBe(150);
  });
});
