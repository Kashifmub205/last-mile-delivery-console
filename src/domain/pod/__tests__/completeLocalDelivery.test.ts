import { resolveCompletionLocation } from '@/domain/location/completionLocation';
import {
  createOutboxDelivery,
  hasLocalDeliveryForStop,
} from '@/domain/outbox/outboxDelivery';
import { prepareLocalDeliveryCompletion } from '@/domain/pod/completeLocalDelivery';
import { sanitizePodAnswers } from '@/domain/pod/sanitizeAnswers';
import type { PodAnswers } from '@/domain/pod/types';
import {
  createInitialRouteProgress,
  type RouteProgressSnapshot,
} from '@/domain/route/routeProgress';
import { reconcileRouteProgressFromOutbox } from '@/domain/route/reconcileRouteProgress';
import { POD_TEMPLATE_FIXTURES, ROUTE_FIXTURE } from '@/mock/fixtures';

const routeStops = ROUTE_FIXTURE.stops;
const residentialTemplate = POD_TEMPLATE_FIXTURES.residential;
const commercialTemplate = POD_TEMPLATE_FIXTURES.commercial;

function filledResidentialAnswers(
  overrides: Partial<PodAnswers> = {},
): PodAnswers {
  return {
    recipient_name: 'Ayesha Khan',
    handed_to: 'Customer',
    photo_not_required_ack: ['Confirmed'],
    ...overrides,
  };
}

function buildCompletionInput(
  stopId: string,
  answers: PodAnswers,
  template = residentialTemplate,
) {
  const stop = routeStops.find(routeStop => routeStop.id === stopId);

  if (!stop) {
    throw new Error(`Missing stop fixture: ${stopId}`);
  }

  return {
    routeId: ROUTE_FIXTURE.routeId,
    stopId,
    templateId: stop.templateId,
    completedAt: '2026-08-28T10:00:00.000Z',
    location: resolveCompletionLocation(stop),
    response: sanitizePodAnswers(template, answers),
  };
}

describe('prepareLocalDeliveryCompletion', () => {
  it('creates one local delivery for a valid active stop', () => {
    const progress = createInitialRouteProgress(routeStops);
    const answers = filledResidentialAnswers();
    const input = buildCompletionInput('stop-001', answers);

    const result = prepareLocalDeliveryCompletion(
      [],
      routeStops,
      progress,
      input,
      '2026-08-28T10:00:00.000Z',
    );

    expect(result.outcome).toBe('ready');
    if (result.outcome !== 'ready') {
      return;
    }

    expect(result.delivery.state).toBe('QUEUED');
    expect(result.delivery.stopId).toBe('stop-001');
    expect(result.delivery.clientDeliveryId).toBeTruthy();
    expect(result.nextProgress.completedStopIds).toEqual(['stop-001']);
    expect(result.nextProgress.activeStopId).toBe('stop-002');
  });

  it('prevents duplicate local completion for the same stop', () => {
    const progress = createInitialRouteProgress(routeStops);
    const answers = filledResidentialAnswers();
    const input = buildCompletionInput('stop-001', answers);
    const existing = createOutboxDelivery(input, '2026-08-28T09:00:00.000Z');

    const result = prepareLocalDeliveryCompletion(
      [existing],
      routeStops,
      progress,
      input,
      '2026-08-28T10:00:00.000Z',
    );

    expect(result).toEqual({
      outcome: 'duplicate',
      existing,
    });
    expect(
      hasLocalDeliveryForStop([existing], input.routeId, input.stopId),
    ).toBe(true);
  });

  it('excludes stale hidden answers from the queued delivery response', () => {
    const progress = createInitialRouteProgress(routeStops);
    const answers = filledResidentialAnswers({
      handed_to: 'Safe place',
      safe_place_location: 'Behind gate',
    });
    const input = buildCompletionInput('stop-001', {
      ...answers,
      handed_to: 'Customer',
      safe_place_location: 'Behind gate',
    });

    const result = prepareLocalDeliveryCompletion(
      [],
      routeStops,
      progress,
      input,
      '2026-08-28T10:00:00.000Z',
    );

    expect(result.outcome).toBe('ready');
    if (result.outcome !== 'ready') {
      return;
    }

    expect(result.delivery.response).toEqual([
      { fieldId: 'recipient_name', value: 'Ayesha Khan' },
      { fieldId: 'handed_to', value: 'Customer' },
      { fieldId: 'photo_not_required_ack', value: ['Confirmed'] },
    ]);
    expect(
      result.delivery.response.some(
        answer => answer.fieldId === 'safe_place_location',
      ),
    ).toBe(false);
  });
});

describe('reconcileRouteProgressFromOutbox', () => {
  it('marks a stop completed when outbox has a delivery but route progress does not', () => {
    const progress = createInitialRouteProgress(routeStops);
    const delivery = createOutboxDelivery(
      buildCompletionInput('stop-001', filledResidentialAnswers()),
      '2026-08-28T09:00:00.000Z',
    );

    const reconciled = reconcileRouteProgressFromOutbox(
      routeStops,
      progress,
      [delivery],
      ROUTE_FIXTURE.routeId,
    );

    expect(reconciled.completedStopIds).toEqual(['stop-001']);
    expect(reconciled.activeStopId).toBe('stop-002');
  });

  it('advances the active stop by route sequence after reconciliation', () => {
    const progress: RouteProgressSnapshot = {
      activeStopId: 'stop-001',
      completedStopIds: ['stop-001'],
    };
    const firstDelivery = createOutboxDelivery(
      buildCompletionInput('stop-001', filledResidentialAnswers()),
      '2026-08-28T09:00:00.000Z',
    );
    const secondDelivery = createOutboxDelivery(
      buildCompletionInput(
        'stop-002',
        {
          signatory_name: 'Ali',
          handover_time: '2026-08-28T10:00:00.000Z',
          handover_location: 'Reception',
        },
        commercialTemplate,
      ),
      '2026-08-28T10:00:00.000Z',
    );

    const reconciled = reconcileRouteProgressFromOutbox(
      routeStops,
      progress,
      [firstDelivery, secondDelivery],
      ROUTE_FIXTURE.routeId,
    );

    expect(reconciled.completedStopIds).toEqual(['stop-001', 'stop-002']);
    expect(reconciled.activeStopId).toBe('stop-003');
  });
});
