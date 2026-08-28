import { syncOneDelivery } from './syncOneDelivery';
import { getIsOnline } from './connectivity';

export type SyncPassResult =
  | {
      ok: true;
      syncedCount: number;
      attemptedCount: number;
    }
  | {
      ok: false;
      reason: 'pass_in_progress' | 'offline' | 'not_hydrated';
    };

let passInProgress = false;
let pendingPassRequested = false;

const passInProgressListeners = new Set<(inProgress: boolean) => void>();

function setPassInProgress(next: boolean): void {
  if (passInProgress === next) {
    return;
  }

  passInProgress = next;

  for (const listener of passInProgressListeners) {
    listener(passInProgress);
  }
}

export function isSyncPassInProgress(): boolean {
  return passInProgress;
}

export function subscribeSyncPassInProgress(
  listener: (inProgress: boolean) => void,
): () => void {
  passInProgressListeners.add(listener);

  return () => {
    passInProgressListeners.delete(listener);
  };
}

export async function requestSyncPass(): Promise<SyncPassResult> {
  if (passInProgress) {
    pendingPassRequested = true;
    return { ok: false, reason: 'pass_in_progress' };
  }

  if (!getIsOnline()) {
    return { ok: false, reason: 'offline' };
  }

  return runSyncPass();
}

async function runSyncPass(): Promise<SyncPassResult> {
  setPassInProgress(true);

  let syncedCount = 0;
  let attemptedCount = 0;

  try {
    while (getIsOnline()) {
      const result = await syncOneDelivery();

      if (result.ok) {
        syncedCount += 1;
        attemptedCount += 1;
        continue;
      }

      if (result.reason === 'nothing_to_sync') {
        break;
      }

      if (result.reason === 'not_hydrated') {
        return { ok: false, reason: 'not_hydrated' };
      }

      attemptedCount += 1;
    }

    return {
      ok: true,
      syncedCount,
      attemptedCount,
    };
  } finally {
    setPassInProgress(false);

    if (pendingPassRequested) {
      pendingPassRequested = false;

      if (getIsOnline()) {
        void requestSyncPass();
      }
    }
  }
}
