import { MAX_SYNC_RETRIES } from '@/constants/sync';
import type { OutboxDelivery } from '@/types/outbox';
import { classifyDeliveryFailureStatus } from './classifyDeliveryFailure';
import { computeNextRetryAt } from './computeNextRetryAt';

export function applyNonRetryableFailure(
  delivery: OutboxDelivery,
  message: string,
  attemptedAt: string = new Date().toISOString(),
): OutboxDelivery {
  return {
    ...delivery,
    state: 'FAILED',
    lastAttemptAt: attemptedAt,
    lastError: message,
    nextRetryAt: undefined,
  };
}

export function applyRetryableFailure(
  delivery: OutboxDelivery,
  message: string,
  attemptedAt: string = new Date().toISOString(),
  maxRetries: number = MAX_SYNC_RETRIES,
): OutboxDelivery {
  const nextRetryCount = delivery.retryCount + 1;

  if (nextRetryCount >= maxRetries) {
    return {
      ...delivery,
      state: 'FAILED',
      retryCount: nextRetryCount,
      lastAttemptAt: attemptedAt,
      lastError: message,
      nextRetryAt: undefined,
    };
  }

  return {
    ...delivery,
    state: 'RETRYING',
    retryCount: nextRetryCount,
    lastAttemptAt: attemptedAt,
    lastError: message,
    nextRetryAt: computeNextRetryAt(nextRetryCount, attemptedAt),
  };
}

export function applySyncFailure(
  delivery: OutboxDelivery,
  message: string,
  status: number,
  attemptedAt: string = new Date().toISOString(),
): OutboxDelivery {
  const failureKind = classifyDeliveryFailureStatus(status);

  if (failureKind === 'non_retryable') {
    return applyNonRetryableFailure(delivery, message, attemptedAt);
  }

  return applyRetryableFailure(delivery, message, attemptedAt);
}
