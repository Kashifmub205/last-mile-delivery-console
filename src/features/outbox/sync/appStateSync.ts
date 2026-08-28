import { AppState, type AppStateStatus } from 'react-native';

let subscription: ReturnType<typeof AppState.addEventListener> | null = null;
let currentState: AppStateStatus = AppState.currentState;

function isForegroundState(state: AppStateStatus): boolean {
  return state === 'active';
}

export function initAppStateSync(onForeground: () => void): void {
  subscription = AppState.addEventListener('change', nextState => {
    if (!isForegroundState(currentState) && isForegroundState(nextState)) {
      onForeground();
    }

    currentState = nextState;
  });
}

export function teardownAppStateSync(): void {
  subscription?.remove();
  subscription = null;
}
