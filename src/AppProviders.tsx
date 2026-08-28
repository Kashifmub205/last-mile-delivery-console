import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  initOutboxSync,
  teardownOutboxSync,
} from '@/features/outbox/sync/initOutboxSync';
import { bootstrapRouteProgress } from '@/features/route/store/routeProgressStore';
import { ROUTE_FIXTURE } from '@/mock/fixtures';

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    void bootstrapRouteProgress(ROUTE_FIXTURE.stops);
    void initOutboxSync();

    return () => {
      teardownOutboxSync();
    };
  }, []);

  return <SafeAreaProvider>{children}</SafeAreaProvider>;
}
