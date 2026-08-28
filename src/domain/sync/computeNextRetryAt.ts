import { SYNC_BACKOFF_BASE_MS } from '@/constants/sync';

/**
 * Production-style exponential backoff:
 *   delayMs = baseMs * 2^(retryCount - 1)
 *
 * Example with baseMs = 1000:
 *   retry 1 → 1s, retry 2 → 2s, retry 3 → 4s, retry 4 → 8s, retry 5 → 16s
 *
 * SYNC_BACKOFF_BASE_MS is intentionally small in development so backoff can be
 * exercised without waiting minutes. Production uses the same formula with a
 * larger base constant.
 */
export function computeRetryDelayMs(
  retryCount: number,
  baseMs: number = SYNC_BACKOFF_BASE_MS,
): number {
  if (retryCount <= 0) {
    return 0;
  }

  return baseMs * 2 ** (retryCount - 1);
}

export function computeNextRetryAt(
  retryCount: number,
  attemptedAt: string,
  baseMs: number = SYNC_BACKOFF_BASE_MS,
): string {
  const delayMs = computeRetryDelayMs(retryCount, baseMs);
  const nextRetryTime = new Date(attemptedAt).getTime() + delayMs;

  return new Date(nextRetryTime).toISOString();
}
