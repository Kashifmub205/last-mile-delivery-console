import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { bootstrapRouteProgress } from '@/features/route/store/routeProgressStore';
import { ROUTE_FIXTURE } from '@/mock/fixtures';

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    void bootstrapRouteProgress(ROUTE_FIXTURE.stops);
  }, []);

  return <SafeAreaProvider>{children}</SafeAreaProvider>;
}
