import uuid from 'react-native-uuid';
import type { Coordinate } from '@/types/location';
import type { PodFieldAnswer, PodSubmission } from '@/types/pod';
import type { OutboxDelivery } from '@/types/outbox';

export type EnqueueOutboxDeliveryInput = {
  routeId: string;
  stopId: string;
  templateId: string;
  completedAt: string;
  location: Coordinate;
  response: PodFieldAnswer[];
};

export function createOutboxDelivery(
  input: EnqueueOutboxDeliveryInput,
  createdAt: string = new Date().toISOString(),
): OutboxDelivery {
  return {
    clientDeliveryId: String(uuid.v4()),
    routeId: input.routeId,
    stopId: input.stopId,
    templateId: input.templateId,
    completedAt: input.completedAt,
    location: input.location,
    response: input.response,
    state: 'QUEUED',
    retryCount: 0,
    createdAt,
  };
}

export function listOutboxDeliveries(
  deliveries: OutboxDelivery[],
): OutboxDelivery[] {
  return [...deliveries].sort(
    (left, right) =>
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );
}

export function enqueueOutboxDelivery(
  deliveries: OutboxDelivery[],
  input: EnqueueOutboxDeliveryInput,
  createdAt: string = new Date().toISOString(),
): OutboxDelivery[] {
  return [...deliveries, createOutboxDelivery(input, createdAt)];
}

export function selectOldestQueuedDelivery(
  deliveries: OutboxDelivery[],
): OutboxDelivery | null {
  const queued = deliveries.filter(delivery => delivery.state === 'QUEUED');
  return listOutboxDeliveries(queued)[0] ?? null;
}

export function isDeliveryEligibleForSync(
  delivery: OutboxDelivery,
  now: Date = new Date(),
): boolean {
  if (delivery.state === 'QUEUED') {
    return true;
  }

  if (delivery.state === 'RETRYING') {
    if (!delivery.nextRetryAt) {
      return true;
    }

    return new Date(delivery.nextRetryAt).getTime() <= now.getTime();
  }

  return false;
}

export function selectNextEligibleDelivery(
  deliveries: OutboxDelivery[],
  now: Date = new Date(),
): OutboxDelivery | null {
  const eligible = deliveries.filter(delivery =>
    isDeliveryEligibleForSync(delivery, now),
  );

  return listOutboxDeliveries(eligible)[0] ?? null;
}

export function replaceOutboxDelivery(
  deliveries: OutboxDelivery[],
  updated: OutboxDelivery,
): OutboxDelivery[] {
  return deliveries.map(delivery =>
    delivery.clientDeliveryId === updated.clientDeliveryId ? updated : delivery,
  );
}

export function outboxDeliveryToSubmission(
  delivery: OutboxDelivery,
): PodSubmission {
  return {
    stopId: delivery.stopId,
    templateId: delivery.templateId,
    clientDeliveryId: delivery.clientDeliveryId,
    completedAt: delivery.completedAt,
    location: delivery.location,
    response: delivery.response,
  };
}

export function markDeliverySyncing(
  delivery: OutboxDelivery,
  attemptedAt: string = new Date().toISOString(),
): OutboxDelivery {
  return {
    ...delivery,
    state: 'SYNCING',
    lastAttemptAt: attemptedAt,
    lastError: undefined,
    nextRetryAt: undefined,
  };
}

export function markDeliverySynced(delivery: OutboxDelivery): OutboxDelivery {
  return {
    ...delivery,
    state: 'SYNCED',
    lastError: undefined,
    nextRetryAt: undefined,
  };
}

export function recoverStaleSyncingDelivery(
  delivery: OutboxDelivery,
): OutboxDelivery {
  if (delivery.state !== 'SYNCING') {
    return delivery;
  }

  return {
    ...delivery,
    state: 'QUEUED',
  };
}

export function recoverStaleSyncingDeliveries(
  deliveries: OutboxDelivery[],
): OutboxDelivery[] {
  return deliveries.map(recoverStaleSyncingDelivery);
}

export function reviveFailedOutboxDelivery(
  delivery: OutboxDelivery,
): OutboxDelivery {
  if (delivery.state !== 'FAILED') {
    return delivery;
  }

  return {
    ...delivery,
    state: 'QUEUED',
    retryCount: 0,
    lastError: undefined,
    lastAttemptAt: undefined,
    nextRetryAt: undefined,
  };
}
