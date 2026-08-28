import { syncOneDelivery } from '../syncOneDelivery';
import {
  isSyncPassInProgress,
  requestSyncPass,
  subscribeSyncPassInProgress,
} from '../syncCoordinator';

jest.mock('../syncOneDelivery', () => ({
  syncOneDelivery: jest.fn(),
}));

jest.mock('../connectivity', () => ({
  getIsOnline: jest.fn(() => true),
}));

const mockSyncOneDelivery = syncOneDelivery as jest.MockedFunction<
  typeof syncOneDelivery
>;

describe('syncCoordinator pass progress subscription', () => {
  beforeEach(() => {
    mockSyncOneDelivery.mockReset();
    mockSyncOneDelivery.mockResolvedValue({
      ok: false,
      reason: 'nothing_to_sync',
    });
  });

  it('notifies listeners when a pass starts and finishes', async () => {
    const states: boolean[] = [];
    const unsubscribe = subscribeSyncPassInProgress(inProgress => {
      states.push(inProgress);
    });

    await requestSyncPass();

    unsubscribe();

    expect(states).toEqual([true, false]);
    expect(isSyncPassInProgress()).toBe(false);
  });

  it('stops notifying after unsubscribe', async () => {
    const states: boolean[] = [];
    const unsubscribe = subscribeSyncPassInProgress(inProgress => {
      states.push(inProgress);
    });

    unsubscribe();
    await requestSyncPass();

    expect(states).toEqual([]);
    expect(isSyncPassInProgress()).toBe(false);
  });

  it('notifies for a chained pass requested while one is in progress', async () => {
    let releaseFirstPass: (() => void) | undefined;
    const firstPassGate = new Promise<void>(resolve => {
      releaseFirstPass = resolve;
    });

    mockSyncOneDelivery
      .mockImplementationOnce(async () => {
        await firstPassGate;
        return { ok: false, reason: 'nothing_to_sync' };
      })
      .mockResolvedValue({ ok: false, reason: 'nothing_to_sync' });

    const states: boolean[] = [];
    const unsubscribe = subscribeSyncPassInProgress(inProgress => {
      states.push(inProgress);
    });

    const firstPass = requestSyncPass();
    await Promise.resolve();
    void requestSyncPass();

    releaseFirstPass?.();
    await firstPass;
    await Promise.resolve();

    unsubscribe();

    expect(states).toEqual([true, false, true, false]);
    expect(isSyncPassInProgress()).toBe(false);
  });
});
