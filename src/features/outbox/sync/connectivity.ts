import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

let isOnline = false;
let unsubscribe: (() => void) | null = null;

function readIsConnected(state: NetInfoState): boolean {
  return state.isConnected === true && state.isInternetReachable !== false;
}

export function getIsOnline(): boolean {
  return isOnline;
}

export async function initConnectivity(onOnline: () => void): Promise<boolean> {
  const initialState = await NetInfo.fetch();
  isOnline = readIsConnected(initialState);

  unsubscribe = NetInfo.addEventListener(state => {
    const wasOnline = isOnline;
    isOnline = readIsConnected(state);

    if (!wasOnline && isOnline) {
      onOnline();
    }
  });

  return isOnline;
}

export function teardownConnectivity(): void {
  unsubscribe?.();
  unsubscribe = null;
}
