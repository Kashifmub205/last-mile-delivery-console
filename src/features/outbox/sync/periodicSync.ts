import { SYNC_POLL_INTERVAL_MS } from '@/constants/sync';
import { getIsOnline } from './connectivity';

let intervalId: ReturnType<typeof setInterval> | null = null;

export function initPeriodicSync(onTick: () => void): void {
  intervalId = setInterval(() => {
    if (getIsOnline()) {
      onTick();
    }
  }, SYNC_POLL_INTERVAL_MS);
}

export function teardownPeriodicSync(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
