import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ZoneMachineState } from '@/domain/geofence/zoneStateMachine';
import { completeStopZone } from '@/domain/geofence/zoneStateMachine';
import { getStorage, StorageKeys } from '@/storage';

type ActiveStopZonePersisted = {
  zone: ZoneMachineState | null;
};

export type ActiveStopZoneState = ActiveStopZonePersisted & {
  hasHydrated: boolean;
  setZone: (zone: ZoneMachineState | null) => void;
  tearDown: () => void;
};

const activeStopZoneStorage = {
  getItem: (name: string) => getStorage().getString(name) ?? null,
  setItem: (name: string, value: string) => {
    getStorage().set(name, value);
  },
  removeItem: (name: string) => {
    getStorage().remove(name);
  },
};

let bootstrapStarted = false;

export const useActiveStopZoneStore = create<ActiveStopZoneState>()(
  persist(
    set => ({
      zone: null,
      hasHydrated: false,

      setZone: zone => {
        set({ zone });
      },

      tearDown: () => {
        set(state => ({
          zone: state.zone ? completeStopZone(state.zone) : null,
        }));
      },
    }),
    {
      name: StorageKeys.activeStopZone,
      storage: createJSONStorage(() => activeStopZoneStorage),
      partialize: state => ({
        zone: state.zone,
      }),
    },
  ),
);

export async function bootstrapActiveStopZone(): Promise<void> {
  if (bootstrapStarted) {
    return;
  }

  bootstrapStarted = true;
  await useActiveStopZoneStore.persist.rehydrate();
  useActiveStopZoneStore.setState({ hasHydrated: true });
}
