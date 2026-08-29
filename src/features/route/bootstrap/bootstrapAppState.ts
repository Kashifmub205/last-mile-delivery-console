import { getRoute } from '@/api/deliveryApi';
import { bootstrapOutbox } from '@/features/outbox/store/outboxStore';
import { syncActiveStopZoneWithRoute } from '@/features/location/activeStopLocation';
import { bootstrapActiveStopZone } from '@/features/route/store/activeStopZoneStore';
import { bootstrapRouteProgress } from '@/features/route/store/routeProgressStore';

import { reconcileRouteProgressWithOutbox } from './reconcileRouteProgress';

export async function bootstrapAppState(): Promise<void> {
  await bootstrapOutbox();

  const routeResult = await getRoute();

  if (!routeResult.ok) {
    throw new Error(`Failed to load route: ${routeResult.error.message}`);
  }

  const route = routeResult.data;

  await bootstrapRouteProgress(route.stops);
  await bootstrapActiveStopZone();
  reconcileRouteProgressWithOutbox(route.stops, route.routeId);
  syncActiveStopZoneWithRoute();
}
