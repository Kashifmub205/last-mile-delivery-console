import { reviveFailedOutboxDelivery } from '@/domain/outbox/outboxDelivery';
import { retryFailedDeliveryAndRequestSync } from '@/features/outbox/manualRetry';
import type { OutboxDelivery } from '@/types/outbox';

function failedDelivery(
  overrides: Partial<OutboxDelivery> = {},
): OutboxDelivery {
  return {
    clientDeliveryId: 'client-delivery-stable-key',
    routeId: 'route-1',
    stopId: 'stop-001',
    templateId: 'tpl-residential',
    completedAt: '2026-08-28T10:00:00.000Z',
    location: { latitude: 24.86, longitude: 67.0 },
    response: [],
    state: 'FAILED',
    retryCount: 5,
    createdAt: '2026-08-28T09:59:00.000Z',
    lastAttemptAt: '2026-08-28T10:05:00.000Z',
    nextRetryAt: undefined,
    lastError: 'Mock server unavailable',
    ...overrides,
  };
}

describe('manual outbox retry', () => {
  it('resets a FAILED delivery while preserving the same clientDeliveryId', () => {
    const original = failedDelivery();
    const revived = reviveFailedOutboxDelivery(original);

    expect(revived.clientDeliveryId).toBe(original.clientDeliveryId);
    expect(revived.state).toBe('QUEUED');
    expect(revived.retryCount).toBe(0);
    expect(revived.lastError).toBeUndefined();
    expect(revived.lastAttemptAt).toBeUndefined();
    expect(revived.nextRetryAt).toBeUndefined();
  });

  it('requests sync through the existing coordinator after revive', () => {
    const retryFailedDelivery = jest.fn();
    const requestSyncPass = jest.fn();

    retryFailedDeliveryAndRequestSync(
      'client-delivery-stable-key',
      retryFailedDelivery,
      requestSyncPass,
    );

    expect(retryFailedDelivery).toHaveBeenCalledTimes(1);
    expect(retryFailedDelivery).toHaveBeenCalledWith(
      'client-delivery-stable-key',
    );
    expect(requestSyncPass).toHaveBeenCalledTimes(1);
    expect(retryFailedDelivery.mock.invocationCallOrder[0]).toBeLessThan(
      requestSyncPass.mock.invocationCallOrder[0],
    );
  });

  it('still revives when sync request is a no-op (offline / pass guard)', () => {
    const original = failedDelivery();
    const retryFailedDelivery = jest.fn((id: string) => {
      expect(id).toBe(original.clientDeliveryId);
      return reviveFailedOutboxDelivery(original);
    });
    const requestSyncPass = jest.fn(() => ({
      ok: false,
      reason: 'offline' as const,
    }));

    retryFailedDeliveryAndRequestSync(
      original.clientDeliveryId,
      retryFailedDelivery,
      requestSyncPass,
    );

    expect(retryFailedDelivery).toHaveBeenCalledTimes(1);
    expect(requestSyncPass).toHaveBeenCalledTimes(1);
  });
});
