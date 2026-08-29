import type { PodSubmission } from '@/types/pod';
import { getPodTemplate, getRoute, postRouteDelivery } from '@/api/deliveryApi';
import { ROUTE_FIXTURE, POD_TEMPLATE_FIXTURES } from '@/mock/fixtures';
import {
  resetMockDeliveryAttemptCounts,
  setMockDeliveryControls,
} from '@/mock/server/mockDeliveryControls';

const residentialTemplate = POD_TEMPLATE_FIXTURES.residential;

const submission: PodSubmission = {
  stopId: 'stop-001',
  templateId: residentialTemplate.templateId,
  clientDeliveryId: 'client-delivery-api-1',
  completedAt: '2026-08-28T10:00:00.000Z',
  location: { latitude: 51.5, longitude: -0.12 },
  response: [{ fieldId: 'recipient_name', value: 'Test Recipient' }],
};

describe('mock API GET endpoints', () => {
  beforeEach(() => {
    setMockDeliveryControls({ mode: 'none' });
    resetMockDeliveryAttemptCounts();
  });

  it('GET /route returns the route fixture via getRoute()', async () => {
    const result = await getRoute();

    expect(result).toEqual({
      ok: true,
      data: ROUTE_FIXTURE,
    });
  });

  it('GET /pod-templates/:id returns the matching template', async () => {
    const result = await getPodTemplate(residentialTemplate.templateId);

    expect(result).toEqual({
      ok: true,
      data: residentialTemplate,
    });
  });

  it('GET /pod-templates/:id returns 404 for an unknown template', async () => {
    const result = await getPodTemplate('missing-template-id');

    expect(result).toEqual({
      ok: false,
      status: 404,
      error: {
        message: 'POD template not found: missing-template-id',
      },
    });
  });
});

describe('POST /routes/:id/deliveries via mock adapter', () => {
  beforeEach(() => {
    setMockDeliveryControls({ mode: 'none' });
    resetMockDeliveryAttemptCounts();
  });

  it('accepts a delivery and treats a repeated Idempotency-Key as synced duplicate', async () => {
    const idempotencyKey = `idem-get-api-${Date.now()}-${Math.random()}`;

    const first = await postRouteDelivery(
      ROUTE_FIXTURE.routeId,
      submission,
      idempotencyKey,
    );

    expect(first.outcome).toBe('synced');
    if (first.outcome !== 'synced') {
      return;
    }

    expect(first.duplicate).toBe(false);
    expect(typeof first.deliveryId).toBe('string');
    expect(first.deliveryId.length).toBeGreaterThan(0);

    const second = await postRouteDelivery(
      ROUTE_FIXTURE.routeId,
      submission,
      idempotencyKey,
    );

    expect(second).toEqual({
      outcome: 'synced',
      deliveryId: first.deliveryId,
      duplicate: true,
    });
  });
});
