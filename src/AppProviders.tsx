import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  initOutboxSync,
  teardownOutboxSync,
} from '@/features/outbox/sync/initOutboxSync';
import { bootstrapAppState } from '@/features/route/bootstrap/bootstrapAppState';

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    void (async () => {
      await bootstrapAppState();
      await initOutboxSync();
    })();

    return () => {
      teardownOutboxSync();
    };
  }, []);

  return <SafeAreaProvider>{children}</SafeAreaProvider>;
}
