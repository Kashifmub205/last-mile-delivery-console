import {
  createOutboxDelivery,
  findDeliveryForStop,
  type EnqueueOutboxDeliveryInput,
} from '@/domain/outbox/outboxDelivery';
import {
  completeStopInProgress,
  type RouteProgressSnapshot,
} from '@/domain/route/routeProgress';
import type { OutboxDelivery } from '@/types/outbox';
import type { RouteStop } from '@/types/route';

export type PrepareLocalDeliveryCompletionResult =
  | { outcome: 'duplicate'; existing: OutboxDelivery }
  | { outcome: 'not_active_stop' }
  | {
      outcome: 'ready';
      delivery: OutboxDelivery;
      nextProgress: RouteProgressSnapshot;
    };

export function prepareLocalDeliveryCompletion(
  deliveries: OutboxDelivery[],
  stops: RouteStop[],
  progress: RouteProgressSnapshot,
  input: EnqueueOutboxDeliveryInput,
  createdAt: string = new Date().toISOString(),
): PrepareLocalDeliveryCompletionResult {
  const existing = findDeliveryForStop(deliveries, input.routeId, input.stopId);

  if (existing) {
    return { outcome: 'duplicate', existing };
  }

  if (input.stopId !== progress.activeStopId) {
    return { outcome: 'not_active_stop' };
  }

  const delivery = createOutboxDelivery(input, createdAt);
  const nextProgress = completeStopInProgress(stops, progress, input.stopId);

  return {
    outcome: 'ready',
    delivery,
    nextProgress,
  };
}
