export const MAX_SYNC_RETRIES = 5;

/** Dev base delay (ms). Production uses the same exponential formula with a larger base. */
export const SYNC_BACKOFF_BASE_MS = 1000;

/** Dev poll interval (ms). Short enough to verify automatic sync manually. */
export const SYNC_POLL_INTERVAL_MS = 15_000;
