import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  createOutboxDelivery,
  recoverStaleSyncingDeliveries,
  replaceOutboxDelivery,
  reviveFailedOutboxDelivery,
  type EnqueueOutboxDeliveryInput,
} from '@/domain/outbox/outboxDelivery';
import { getStorage, StorageKeys } from '@/storage';
import type { OutboxDelivery } from '@/types/outbox';

type OutboxPersisted = {
  deliveries: OutboxDelivery[];
};

export type OutboxStoreState = OutboxPersisted & {
  hasHydrated: boolean;
  enqueueDelivery: (input: EnqueueOutboxDeliveryInput) => OutboxDelivery;
  setDelivery: (delivery: OutboxDelivery) => void;
  retryFailedDelivery: (clientDeliveryId: string) => void;
};

const outboxStorage = {
  getItem: (name: string) => getStorage().getString(name) ?? null,
  setItem: (name: string, value: string) => {
    getStorage().set(name, value);
  },
  removeItem: (name: string) => {
    getStorage().remove(name);
  },
};

let bootstrapStarted = false;

export const useOutboxStore = create<OutboxStoreState>()(
  persist(
    set => ({
      deliveries: [],
      hasHydrated: false,

      enqueueDelivery: input => {
        const delivery = createOutboxDelivery(input);

        set(state => ({
          deliveries: [...state.deliveries, delivery],
        }));

        return delivery;
      },

      setDelivery: delivery => {
        set(state => ({
          deliveries: replaceOutboxDelivery(state.deliveries, delivery),
        }));
      },

      retryFailedDelivery: clientDeliveryId => {
        set(state => ({
          deliveries: state.deliveries.map(delivery =>
            delivery.clientDeliveryId === clientDeliveryId
              ? reviveFailedOutboxDelivery(delivery)
              : delivery,
          ),
        }));
      },
    }),
    {
      name: StorageKeys.outbox,
      storage: createJSONStorage(() => outboxStorage),
      partialize: state => ({
        deliveries: state.deliveries,
      }),
    },
  ),
);

export async function bootstrapOutbox(): Promise<void> {
  if (bootstrapStarted) {
    return;
  }

  bootstrapStarted = true;
  await useOutboxStore.persist.rehydrate();

  const { deliveries } = useOutboxStore.getState();
  const recoveredDeliveries = recoverStaleSyncingDeliveries(deliveries);
  const hasRecoveredDeliveries = recoveredDeliveries.some(
    (delivery, index) => delivery.state !== deliveries[index]?.state,
  );

  if (hasRecoveredDeliveries) {
    useOutboxStore.setState({ deliveries: recoveredDeliveries });
  }

  useOutboxStore.setState({ hasHydrated: true });
}
