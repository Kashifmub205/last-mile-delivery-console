import { prepareLocalDeliveryCompletion } from '@/domain/pod/completeLocalDelivery';
import type { EnqueueOutboxDeliveryInput } from '@/domain/outbox/outboxDelivery';
import { syncActiveStopZoneWithRoute } from '@/features/location/activeStopLocation';
import { useActiveStopZoneStore } from '@/features/route/store/activeStopZoneStore';
import { useOutboxStore } from '@/features/outbox/store/outboxStore';
import { useRouteProgressStore } from '@/features/route/store/routeProgressStore';
import type { OutboxDelivery } from '@/types/outbox';
import type { RouteStop } from '@/types/route';

export type CompleteLocalDeliveryResult =
  | { outcome: 'duplicate'; existing: OutboxDelivery }
  | { outcome: 'not_active_stop' }
  | { outcome: 'created'; delivery: OutboxDelivery };

export function completeLocalDelivery(
  stops: RouteStop[],
  input: EnqueueOutboxDeliveryInput,
): CompleteLocalDeliveryResult {
  const outboxState = useOutboxStore.getState();
  const routeState = useRouteProgressStore.getState();

  const preparation = prepareLocalDeliveryCompletion(
    outboxState.deliveries,
    stops,
    {
      activeStopId: routeState.activeStopId,
      completedStopIds: routeState.completedStopIds,
    },
    input,
  );

  if (preparation.outcome === 'duplicate') {
    return preparation;
  }

  if (preparation.outcome === 'not_active_stop') {
    return preparation;
  }

  useOutboxStore.setState(state => ({
    deliveries: [...state.deliveries, preparation.delivery],
  }));

  useRouteProgressStore.setState({
    activeStopId: preparation.nextProgress.activeStopId,
    completedStopIds: preparation.nextProgress.completedStopIds,
  });

  useActiveStopZoneStore.getState().tearDown();
  syncActiveStopZoneWithRoute();

  return {
    outcome: 'created',
    delivery: preparation.delivery,
  };
}
