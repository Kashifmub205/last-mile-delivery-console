import { SYNC_BACKOFF_BASE_MS } from '@/constants/sync';

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
