import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  completeStopInProgress,
  createInitialRouteProgress,
} from '@/domain/route/routeProgress';
import { getStorage, hasKey, StorageKeys } from '@/storage';
import type { RouteStop } from '@/types/route';

type RouteProgressPersisted = {
  activeStopId: string | null;
  completedStopIds: string[];
};

export type RouteProgressState = RouteProgressPersisted & {
  hasHydrated: boolean;
  setActiveStopId: (stopId: string | null) => void;
  completeStop: (stopId: string, stops: RouteStop[]) => void;
  resetRouteProgress: (stops: RouteStop[]) => void;
};

const routeProgressStorage = {
  getItem: (name: string) => getStorage().getString(name) ?? null,
  setItem: (name: string, value: string) => {
    getStorage().set(name, value);
  },
  removeItem: (name: string) => {
    getStorage().remove(name);
  },
};

let bootstrapStarted = false;

export const useRouteProgressStore = create<RouteProgressState>()(
  persist(
    set => ({
      activeStopId: null,
      completedStopIds: [],
      hasHydrated: false,

      setActiveStopId: stopId => {
        set({ activeStopId: stopId });
      },

      completeStop: (stopId, stops) => {
        set(state => {
          const nextProgress = completeStopInProgress(stops, state, stopId);
          return {
            activeStopId: nextProgress.activeStopId,
            completedStopIds: nextProgress.completedStopIds,
          };
        });
      },

      resetRouteProgress: stops => {
        set({
          ...createInitialRouteProgress(stops),
        });
      },
    }),
    {
      name: StorageKeys.routeProgress,
      storage: createJSONStorage(() => routeProgressStorage),
      partialize: state => ({
        activeStopId: state.activeStopId,
        completedStopIds: state.completedStopIds,
      }),
    },
  ),
);

export async function bootstrapRouteProgress(stops: RouteStop[]): Promise<void> {
  if (bootstrapStarted) {
    return;
  }

  bootstrapStarted = true;

  const hadPersistedState = hasKey(StorageKeys.routeProgress);
  await useRouteProgressStore.persist.rehydrate();

  if (!hadPersistedState) {
    useRouteProgressStore.getState().resetRouteProgress(stops);
  }

  useRouteProgressStore.setState({ hasHydrated: true });
}
