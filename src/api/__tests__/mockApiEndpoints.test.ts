import type { PodSubmission } from '@/types/pod';
import { getPodTemplate, getRoute, postRouteDelivery } from '@/api/deliveryApi';
import { ROUTE_FIXTURE, POD_TEMPLATE_FIXTURES } from '@/mock/fixtures';
import {
  getMockDeliveryControls,
  resetMockDeliveryControls,
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
    resetMockDeliveryControls();
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
    resetMockDeliveryControls();
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

describe('mock API latency controls', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetMockDeliveryControls();
  });

  afterEach(() => {
    jest.useRealTimers();
    resetMockDeliveryControls();
  });

  it('defaults latency to 0ms', () => {
    expect(getMockDeliveryControls().latencyMs).toBe(0);
  });

  it('configures latency deterministically', () => {
    setMockDeliveryControls({ latencyMs: 500 });
    expect(getMockDeliveryControls().latencyMs).toBe(500);

    setMockDeliveryControls({ latencyMs: 1500 });
    expect(getMockDeliveryControls().latencyMs).toBe(1500);
  });

  it('resetting controls restores 0ms latency', () => {
    setMockDeliveryControls({ latencyMs: 1500, mode: '500' });
    expect(getMockDeliveryControls().latencyMs).toBe(1500);

    resetMockDeliveryControls();

    expect(getMockDeliveryControls()).toEqual({
      mode: 'none',
      message: 'Mock delivery failure',
      failFirstN: 3,
      latencyMs: 0,
    });
  });

  it('applies configured latency to GET /route without real wall-clock wait', async () => {
    setMockDeliveryControls({ latencyMs: 1500 });

    let settled = false;
    const pending = getRoute().then(result => {
      settled = true;
      return result;
    });

    await Promise.resolve();
    expect(settled).toBe(false);

    await jest.advanceTimersByTimeAsync(1499);
    expect(settled).toBe(false);

    await jest.advanceTimersByTimeAsync(1);
    const result = await pending;

    expect(result).toEqual({
      ok: true,
      data: ROUTE_FIXTURE,
    });
  });

  it('applies configured latency to POST /routes/:id/deliveries', async () => {
    setMockDeliveryControls({ latencyMs: 500 });
    const idempotencyKey = `idem-latency-${Date.now()}-${Math.random()}`;

    let settled = false;
    const pending = postRouteDelivery(
      ROUTE_FIXTURE.routeId,
      submission,
      idempotencyKey,
    ).then(result => {
      settled = true;
      return result;
    });

    await Promise.resolve();
    expect(settled).toBe(false);

    await jest.advanceTimersByTimeAsync(499);
    expect(settled).toBe(false);

    await jest.advanceTimersByTimeAsync(1);
    const result = await pending;

    expect(result.outcome).toBe('synced');
  });

  it('skips timer work when latency is 0ms', async () => {
    const setTimeoutSpy = jest.spyOn(globalThis, 'setTimeout');

    const result = await getRoute();

    expect(result.ok).toBe(true);
    expect(setTimeoutSpy).not.toHaveBeenCalled();
    setTimeoutSpy.mockRestore();
  });
});

describe('mock API failure modes via adapter', () => {
  beforeEach(() => {
    resetMockDeliveryControls();
  });

  it('preserves network failure mode', async () => {
    setMockDeliveryControls({ mode: 'network' });

    const result = await postRouteDelivery(
      ROUTE_FIXTURE.routeId,
      submission,
      `idem-network-${Date.now()}`,
    );

    expect(result).toEqual({
      outcome: 'failed',
      message: 'Network request failed',
      status: 0,
      retryable: true,
    });
  });

  it('preserves 400 failure mode', async () => {
    setMockDeliveryControls({
      mode: '400',
      message: 'Invalid stop payload',
    });

    const result = await postRouteDelivery(
      ROUTE_FIXTURE.routeId,
      submission,
      `idem-400-${Date.now()}`,
    );

    expect(result).toEqual({
      outcome: 'failed',
      message: 'Invalid stop payload',
      status: 400,
      retryable: false,
    });
  });

  it('preserves 500 failure mode', async () => {
    setMockDeliveryControls({
      mode: '500',
      message: 'Mock server unavailable',
    });

    const result = await postRouteDelivery(
      ROUTE_FIXTURE.routeId,
      submission,
      `idem-500-${Date.now()}`,
    );

    expect(result).toEqual({
      outcome: 'failed',
      message: 'Mock server unavailable',
      status: 500,
      retryable: true,
    });
  });

  it('preserves fail-first-3 then success', async () => {
    setMockDeliveryControls({
      mode: 'fail_first_n',
      message: 'Mock transient failure',
      failFirstN: 3,
    });

    const idempotencyKey = `idem-fail-first-${Date.now()}-${Math.random()}`;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const failed = await postRouteDelivery(
        ROUTE_FIXTURE.routeId,
        submission,
        idempotencyKey,
      );

      expect(failed).toEqual({
        outcome: 'failed',
        message: `Mock transient failure (attempt ${attempt}/3)`,
        status: 500,
        retryable: true,
      });
    }

    const succeeded = await postRouteDelivery(
      ROUTE_FIXTURE.routeId,
      submission,
      idempotencyKey,
    );

    expect(succeeded.outcome).toBe('synced');
  });
});
