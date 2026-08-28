import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  formatElapsedDuration,
  getElapsedSecondsSince,
} from '@/domain/geofence/zoneOrchestration';
import { findActiveStop, getStopStatus } from '@/domain/route/routeProgress';
import {
  arriveAtActiveStop,
  syncActiveStopZoneWithRoute,
} from '@/features/location/activeStopLocation';
import {
  getDeviceLocationPermissionStatus,
  subscribeDeviceLocationPermission,
  type LocationPermissionStatus,
} from '@/features/location/initDeviceLocation';
import {
  simulateConfirmingFix,
  simulateDepartSequence,
  simulateInsideFix,
  simulateJitterFix,
  simulateOutsideFix,
  simulateReturnInsideSequence,
} from '@/features/location/devLocationSimulator';
import { useOutboxStore } from '@/features/outbox/store/outboxStore';
import { useActiveStopZoneStore } from '@/features/route/store/activeStopZoneStore';
import { useRouteProgressStore } from '@/features/route/store/routeProgressStore';
import { ROUTE_FIXTURE } from '@/mock/fixtures';
import type { RootStackParamList } from '@/navigation/types';
import type { RouteStop } from '@/types/route';
import type { StopStatus } from '@/types/route';
import { styles } from './styles';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Route'>;

const routeStops = ROUTE_FIXTURE.stops;

const stopStatusStyles: Record<StopStatus, object> = {
  PENDING: styles.stopStatus_PENDING,
  ACTIVE: styles.stopStatus_ACTIVE,
  COMPLETED: styles.stopStatus_COMPLETED,
};

function formatPermissionStatus(status: LocationPermissionStatus): string {
  switch (status) {
    case 'checking':
      return 'Checking location permission…';
    case 'granted':
      return 'Location permission granted';
    case 'denied':
      return 'Location permission denied — enable in Settings to use GPS';
    case 'unavailable':
      return 'Device location unavailable on this platform';
  }
}

function readIsOnline(state: NetInfoState): boolean {
  return state.isConnected === true && state.isInternetReachable !== false;
}

function formatCoordinate(
  coordinate: {
    latitude: number;
    longitude: number;
  } | null,
): string {
  if (!coordinate) {
    return 'No accepted fix yet';
  }

  return `${coordinate.latitude.toFixed(5)}, ${coordinate.longitude.toFixed(
    5,
  )}`;
}

function useDepartureElapsed(departedAt: string | null): string {
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    if (!departedAt) {
      return;
    }

    const intervalId = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [departedAt]);

  if (!departedAt) {
    return '';
  }

  return formatElapsedDuration(getElapsedSecondsSince(departedAt, nowMs));
}

function DevSimulatorButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.7}
      style={styles.devButton}
      onPress={onPress}
    >
      <Text style={styles.devButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

function StopRow({
  stop,
  activeStopId,
  completedStopIds,
}: {
  stop: RouteStop;
  activeStopId: string | null;
  completedStopIds: string[];
}) {
  const status = getStopStatus(stop.id, activeStopId, completedStopIds);

  return (
    <View style={styles.stopRow}>
      <View style={styles.stopCopy}>
        <Text style={styles.stopName}>{stop.customerName}</Text>
        <Text style={styles.stopMeta}>
          {stop.id} · {stop.parcelCount} parcel
          {stop.parcelCount === 1 ? '' : 's'}
        </Text>
      </View>
      <Text style={[styles.stopStatus, stopStatusStyles[status]]}>
        {status}
      </Text>
    </View>
  );
}

export function RouteScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const hasHydrated = useRouteProgressStore(state => state.hasHydrated);
  const activeStopId = useRouteProgressStore(state => state.activeStopId);
  const completedStopIds = useRouteProgressStore(
    state => state.completedStopIds,
  );
  const zoneHasHydrated = useActiveStopZoneStore(state => state.hasHydrated);
  const zone = useActiveStopZoneStore(state => state.zone);
  const [arriveError, setArriveError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [permissionStatus, setPermissionStatus] =
    useState<LocationPermissionStatus>(getDeviceLocationPermissionStatus());
  const outboxDeliveries = useOutboxStore(state => state.deliveries);
  const unsyncedCount = useMemo(
    () =>
      outboxDeliveries.filter(delivery => delivery.state !== 'SYNCED').length,
    [outboxDeliveries],
  );

  useEffect(() => {
    void NetInfo.fetch().then(state => {
      setIsOnline(readIsOnline(state));
    });

    return NetInfo.addEventListener(state => {
      setIsOnline(readIsOnline(state));
    });
  }, []);

  useEffect(() => {
    return subscribeDeviceLocationPermission(setPermissionStatus);
  }, []);

  const activeStop = findActiveStop(routeStops, activeStopId);
  const departureElapsed = useDepartureElapsed(zone?.departedAt ?? null);
  const canOpenPod = zone?.zoneState === 'AT_STOP' && activeStop !== null;
  const confirmedObservation =
    zone?.smoothing.confirmedObservation ?? 'Unconfirmed';

  useEffect(() => {
    syncActiveStopZoneWithRoute();
  }, [activeStopId, completedStopIds]);

  if (!hasHydrated || !zoneHasHydrated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.subtitle}>Loading route progress…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={styles.title}>Route</Text>
      <Text style={styles.subtitle}>
        Active stop: {activeStop?.customerName ?? 'None'}
      </Text>

      <View style={styles.statusPanel}>
        <Text style={styles.statusLine}>
          Connectivity:{' '}
          {isOnline === null ? 'Checking…' : isOnline ? 'Online' : 'Offline'}
        </Text>
        <Text style={styles.statusLine}>
          Unsynced deliveries: {unsyncedCount}
        </Text>
      </View>

      {zone?.zoneState === 'DEPARTED_EARLY' ? (
        <View style={styles.warningBanner}>
          <Text style={styles.warningBannerTitle}>Departed early</Text>
          <Text style={styles.warningBannerBody}>
            Away from stop for {departureElapsed}
          </Text>
        </View>
      ) : null}

      {activeStop ? (
        <View style={styles.zonePanel}>
          <Text style={styles.zonePanelTitle}>Active stop geofence</Text>
          <Text style={styles.zonePanelLine}>
            GPS: {formatPermissionStatus(permissionStatus)}
          </Text>
          <Text style={styles.zonePanelLine}>
            Zone state: {zone?.zoneState ?? 'OUTSIDE'}
          </Text>
          <Text style={styles.zonePanelLine}>
            Confirmed: {confirmedObservation}
          </Text>
          <Text style={styles.zonePanelLine}>
            Position: {formatCoordinate(zone?.lastAcceptedFix ?? null)}
          </Text>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.button,
              styles.buttonPrimary,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => {
              const result = arriveAtActiveStop();

              if (!result.ok) {
                setArriveError('Arrive blocked: confirmed inside required.');
                return;
              }

              setArriveError(null);
            }}
          >
            <Text style={styles.buttonPrimaryText}>Arrive</Text>
          </Pressable>

          {arriveError ? (
            <Text style={styles.errorText}>{arriveError}</Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.stopList}>
        {routeStops.map(stop => (
          <StopRow
            key={stop.id}
            stop={stop}
            activeStopId={activeStopId}
            completedStopIds={completedStopIds}
          />
        ))}
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          disabled={!canOpenPod}
          style={({ pressed }) => [
            styles.button,
            styles.buttonPrimary,
            !canOpenPod && styles.buttonDisabled,
            pressed && canOpenPod && styles.buttonPressed,
          ]}
          onPress={() => {
            if (!activeStop) {
              return;
            }

            navigation.navigate('ProofOfDelivery', {
              stopId: activeStop.id,
              templateId: activeStop.templateId,
            });
          }}
        >
          <Text style={styles.buttonPrimaryText}>Open Proof of Delivery</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.button,
            styles.buttonSecondary,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => navigation.navigate('Outbox')}
        >
          <Text style={styles.buttonSecondaryText}>View Outbox</Text>
        </Pressable>
      </View>

      {activeStop ? (
        <View style={styles.devPanel}>
          <Text style={styles.devPanelTitle}>
            Dev / debug: location simulator
          </Text>
          <Text style={styles.devPanelHint}>
            Development-only controls for driving geofence transitions without
            travelling to stop coordinates.
          </Text>

          <DevSimulatorButton
            label="Inject inside"
            onPress={() => simulateInsideFix()}
          />
          <DevSimulatorButton
            label="Inject outside"
            onPress={() => simulateOutsideFix()}
          />
          <DevSimulatorButton
            label="Inject confirming fix"
            onPress={() => simulateConfirmingFix()}
          />
          <DevSimulatorButton
            label="Inject jitter (<10m)"
            onPress={() => simulateJitterFix()}
          />
          <DevSimulatorButton
            label="Simulate depart"
            onPress={() => simulateDepartSequence()}
          />
          <DevSimulatorButton
            label="Simulate return inside"
            onPress={() => simulateReturnInsideSequence()}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}
