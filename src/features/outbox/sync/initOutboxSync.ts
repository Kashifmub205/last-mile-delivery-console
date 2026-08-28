import { initAppStateSync, teardownAppStateSync } from './appStateSync';
import { initConnectivity, teardownConnectivity } from './connectivity';
import { initPeriodicSync, teardownPeriodicSync } from './periodicSync';
import { requestSyncPass } from './syncCoordinator';

let started = false;

function requestSyncPassIfOnline(): void {
  void requestSyncPass();
}

export async function initOutboxSync(): Promise<void> {
  if (started) {
    return;
  }

  started = true;

  const online = await initConnectivity(requestSyncPassIfOnline);
  initAppStateSync(requestSyncPassIfOnline);
  initPeriodicSync(requestSyncPassIfOnline);

  if (online) {
    requestSyncPassIfOnline();
  }
}

export function teardownOutboxSync(): void {
  teardownConnectivity();
  teardownAppStateSync();
  teardownPeriodicSync();
  started = false;
}
