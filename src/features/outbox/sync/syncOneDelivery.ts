import { postRouteDelivery } from '@/api/deliveryApi';
import {
  markDeliverySynced,
  markDeliverySyncing,
  outboxDeliveryToSubmission,
  selectNextEligibleDelivery,
} from '@/domain/outbox/outboxDelivery';
import { applySyncFailure } from '@/domain/sync/applySyncFailure';
import { useOutboxStore } from '@/features/outbox/store/outboxStore';

export type SyncOneResult =
  | {
      ok: true;
      clientDeliveryId: string;
      duplicate: boolean;
    }
  | {
      ok: false;
      reason: 'nothing_to_sync' | 'not_hydrated';
    }
  | {
      ok: false;
      reason: 'post_failed';
      clientDeliveryId: string;
      message: string;
      retryable: boolean;
      terminal: boolean;
    };

export async function syncOneDelivery(): Promise<SyncOneResult> {
  const store = useOutboxStore.getState();

  if (!store.hasHydrated) {
    return { ok: false, reason: 'not_hydrated' };
  }

  const delivery = selectNextEligibleDelivery(store.deliveries);

  if (!delivery) {
    return { ok: false, reason: 'nothing_to_sync' };
  }

  const syncingDelivery = markDeliverySyncing(delivery);
  store.setDelivery(syncingDelivery);

  const result = await postRouteDelivery(
    delivery.routeId,
    outboxDeliveryToSubmission(delivery),
    delivery.clientDeliveryId,
  );

  if (result.outcome === 'synced') {
    store.setDelivery(markDeliverySynced(syncingDelivery));

    return {
      ok: true,
      clientDeliveryId: delivery.clientDeliveryId,
      duplicate: result.duplicate,
    };
  }

  const failedDelivery = applySyncFailure(
    syncingDelivery,
    result.message,
    result.status,
  );
  store.setDelivery(failedDelivery);

  return {
    ok: false,
    reason: 'post_failed',
    clientDeliveryId: delivery.clientDeliveryId,
    message: result.message,
    retryable: result.retryable,
    terminal: failedDelivery.state === 'FAILED',
  };
}
