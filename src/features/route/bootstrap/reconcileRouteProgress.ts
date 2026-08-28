import {
  routeProgressChanged,
  reconcileRouteProgressFromOutbox,
} from '@/domain/route/reconcileRouteProgress';
import { useOutboxStore } from '@/features/outbox/store/outboxStore';
import { useRouteProgressStore } from '@/features/route/store/routeProgressStore';
import type { RouteStop } from '@/types/route';

export function reconcileRouteProgressWithOutbox(
  stops: RouteStop[],
  routeId: string,
): void {
  const outboxState = useOutboxStore.getState();
  const routeState = useRouteProgressStore.getState();

  if (!outboxState.hasHydrated || !routeState.hasHydrated) {
    return;
  }

  const currentProgress = {
    activeStopId: routeState.activeStopId,
    completedStopIds: routeState.completedStopIds,
  };

  const reconciled = reconcileRouteProgressFromOutbox(
    stops,
    currentProgress,
    outboxState.deliveries,
    routeId,
  );

  if (!routeProgressChanged(currentProgress, reconciled)) {
    return;
  }

  useRouteProgressStore.setState({
    activeStopId: reconciled.activeStopId,
    completedStopIds: reconciled.completedStopIds,
  });
}
