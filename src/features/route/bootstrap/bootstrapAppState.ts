import { bootstrapOutbox } from '@/features/outbox/store/outboxStore';
import { syncActiveStopZoneWithRoute } from '@/features/location/activeStopLocation';
import { bootstrapActiveStopZone } from '@/features/route/store/activeStopZoneStore';
import { bootstrapRouteProgress } from '@/features/route/store/routeProgressStore';
import { ROUTE_FIXTURE } from '@/mock/fixtures';

import { reconcileRouteProgressWithOutbox } from './reconcileRouteProgress';

export async function bootstrapAppState(): Promise<void> {
  await bootstrapOutbox();
  await bootstrapRouteProgress(ROUTE_FIXTURE.stops);
  await bootstrapActiveStopZone();
  reconcileRouteProgressWithOutbox(ROUTE_FIXTURE.stops, ROUTE_FIXTURE.routeId);
  syncActiveStopZoneWithRoute();
}
