import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  initDeviceLocation,
  teardownDeviceLocation,
} from '@/features/location/initDeviceLocation';
import {
  initOutboxSync,
  teardownOutboxSync,
} from '@/features/outbox/sync/initOutboxSync';
import { bootstrapAppState } from '@/features/route/bootstrap/bootstrapAppState';

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    void (async () => {
      await bootstrapAppState();
      initDeviceLocation();
      await initOutboxSync();
    })();

    return () => {
      teardownDeviceLocation();
      teardownOutboxSync();
    };
  }, []);

  return <SafeAreaProvider>{children}</SafeAreaProvider>;
}
