import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getRoute } from '@/api/deliveryApi';
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
import {
  LOCAL_SAVE_FEEDBACK_BODY,
  LOCAL_SAVE_FEEDBACK_DISMISS_MS,
  LOCAL_SAVE_FEEDBACK_TITLE,
  shouldShowLocalSaveFeedback,
} from '@/features/route/localSaveFeedback';
import { useActiveStopZoneStore } from '@/features/route/store/activeStopZoneStore';
import { useRouteProgressStore } from '@/features/route/store/routeProgressStore';
import type { RootStackParamList } from '@/navigation/types';
import type { Route, RouteStop, StopStatus } from '@/types/route';
import type { ZoneState } from '@/types/zone';
import { colors } from '@/theme';
import { styles } from './styles';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Route'>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'Route'>;

const stopChipBox: Record<StopStatus, object> = {
  PENDING: styles.chipNeutral,
  ACTIVE: styles.chipPrimary,
  COMPLETED: styles.chipSuccess,
};

const stopChipText: Record<StopStatus, object> = {
  PENDING: styles.chipTextNeutral,
  ACTIVE: styles.chipTextPrimary,
  COMPLETED: styles.chipTextSuccess,
};

const zoneChipBox: Record<ZoneState, object> = {
  OUTSIDE: styles.chipNeutral,
  AT_STOP: styles.chipSuccess,
  DEPARTED_EARLY: styles.chipWarning,
};

const zoneChipText: Record<ZoneState, object> = {
  OUTSIDE: styles.chipTextNeutral,
  AT_STOP: styles.chipTextSuccess,
  DEPARTED_EARLY: styles.chipTextWarning,
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

function StatusChip({
  label,
  boxStyle,
  textStyle,
}: {
  label: string;
  boxStyle: object;
  textStyle: object;
}) {
  return (
    <View style={[styles.chip, boxStyle]}>
      <Text style={[styles.chipText, textStyle]}>{label}</Text>
    </View>
  );
}

function ZoneInfoRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.zoneRow}>
      <Text style={styles.zoneLabel}>{label}</Text>
      <View style={styles.zoneValueSlot}>{children}</View>
    </View>
  );
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
      activeOpacity={0.5}
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
  isLast,
}: {
  stop: RouteStop;
  activeStopId: string | null;
  completedStopIds: string[];
  isLast: boolean;
}) {
  const status = getStopStatus(stop.id, activeStopId, completedStopIds);

  return (
    <View
      style={[
        styles.stopRow,
        status === 'ACTIVE' && styles.stopRowActive,
        isLast && styles.stopRowLast,
      ]}
    >
      <View style={styles.stopCopy}>
        <Text style={styles.stopName}>{stop.customerName}</Text>
        <Text style={styles.stopMeta}>
          {stop.id} · {stop.parcelCount} parcel
          {stop.parcelCount === 1 ? '' : 's'}
        </Text>
      </View>
      <StatusChip
        label={status}
        boxStyle={stopChipBox[status]}
        textStyle={stopChipText[status]}
      />
    </View>
  );
}

export function RouteScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const routeNav = useRoute<ScreenRouteProp>();
  const hasHydrated = useRouteProgressStore(state => state.hasHydrated);
  const activeStopId = useRouteProgressStore(state => state.activeStopId);
  const completedStopIds = useRouteProgressStore(
    state => state.completedStopIds,
  );
  const zoneHasHydrated = useActiveStopZoneStore(state => state.hasHydrated);
  const zone = useActiveStopZoneStore(state => state.zone);
  const [route, setRoute] = useState<Route | null>(null);
  const [routeLoadError, setRouteLoadError] = useState<string | null>(null);
  const [isRouteLoading, setIsRouteLoading] = useState(true);
  const [arriveError, setArriveError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [showLocalSaveFeedback, setShowLocalSaveFeedback] = useState(false);
  const [permissionStatus, setPermissionStatus] =
    useState<LocationPermissionStatus>(getDeviceLocationPermissionStatus());
  const outboxDeliveries = useOutboxStore(state => state.deliveries);
  const unsyncedCount = useMemo(
    () =>
      outboxDeliveries.filter(delivery => delivery.state !== 'SYNCED').length,
    [outboxDeliveries],
  );

  useEffect(() => {
    if (!shouldShowLocalSaveFeedback(routeNav.params)) {
      return;
    }

    setShowLocalSaveFeedback(true);
    navigation.setParams({ deliverySavedLocally: undefined });
  }, [navigation, routeNav.params]);

  useEffect(() => {
    if (!showLocalSaveFeedback) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setShowLocalSaveFeedback(false);
    }, LOCAL_SAVE_FEEDBACK_DISMISS_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [showLocalSaveFeedback]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const result = await getRoute();

      if (cancelled) {
        return;
      }

      if (!result.ok) {
        setRoute(null);
        setRouteLoadError(result.error.message);
        setIsRouteLoading(false);
        return;
      }

      setRoute(result.data);
      setRouteLoadError(null);
      setIsRouteLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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

  const routeStops = route?.stops ?? [];
  const activeStop = findActiveStop(routeStops, activeStopId);
  const departureElapsed = useDepartureElapsed(zone?.departedAt ?? null);
  const hasArrived = zone?.zoneState === 'AT_STOP';
  const canOpenPod = hasArrived && activeStop !== null;
  const confirmedObservation =
    zone?.smoothing.confirmedObservation ?? 'Unconfirmed';
  const zoneState: ZoneState = zone?.zoneState ?? 'OUTSIDE';

  useEffect(() => {
    syncActiveStopZoneWithRoute();
  }, [activeStopId, completedStopIds]);

  if (isRouteLoading || !hasHydrated || !zoneHasHydrated) {
    return (
      <View style={[styles.container, styles.bootState]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.bootSubtitle}>Loading route…</Text>
      </View>
    );
  }

  if (routeLoadError || !route) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.title}>Route</Text>
        <Text style={styles.errorText}>
          {routeLoadError ?? 'Route could not be loaded.'}
        </Text>
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
        {completedStopIds.length} of {routeStops.length} stops complete
      </Text>

      <View style={styles.statusStrip}>
        <StatusChip
          label={
            isOnline === null ? 'Checking…' : isOnline ? 'Online' : 'Offline'
          }
          boxStyle={
            isOnline === null
              ? styles.chipNeutral
              : isOnline
              ? styles.chipSuccess
              : styles.chipError
          }
          textStyle={
            isOnline === null
              ? styles.chipTextNeutral
              : isOnline
              ? styles.chipTextSuccess
              : styles.chipTextError
          }
        />
        <StatusChip
          label={`${unsyncedCount} unsynced`}
          boxStyle={unsyncedCount > 0 ? styles.chipWarning : styles.chipNeutral}
          textStyle={
            unsyncedCount > 0 ? styles.chipTextWarning : styles.chipTextNeutral
          }
        />
      </View>

      {showLocalSaveFeedback ? (
        <View style={styles.successBanner}>
          <View style={styles.successBannerHeader}>
            <Text style={styles.successBannerTitle}>
              {LOCAL_SAVE_FEEDBACK_TITLE}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss local save message"
              onPress={() => setShowLocalSaveFeedback(false)}
              hitSlop={8}
            >
              <Text style={styles.successBannerDismiss}>Dismiss</Text>
            </Pressable>
          </View>
          <Text style={styles.successBannerBody}>
            {LOCAL_SAVE_FEEDBACK_BODY}
          </Text>
        </View>
      ) : null}

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
          <Text style={styles.sectionEyebrow}>Active stop</Text>
          <Text style={styles.activeStopName}>{activeStop.customerName}</Text>
          <Text style={styles.stopMeta}>
            {activeStop.id} · {activeStop.parcelCount} parcel
            {activeStop.parcelCount === 1 ? '' : 's'}
          </Text>

          <View style={styles.zoneRows}>
            <ZoneInfoRow label="Zone">
              <StatusChip
                label={zoneState}
                boxStyle={zoneChipBox[zoneState]}
                textStyle={zoneChipText[zoneState]}
              />
            </ZoneInfoRow>
            <ZoneInfoRow label="Confirmed">
              <Text style={styles.zoneValue}>{confirmedObservation}</Text>
            </ZoneInfoRow>
            <ZoneInfoRow label="GPS">
              <Text style={styles.zoneValue}>
                {formatPermissionStatus(permissionStatus)}
              </Text>
            </ZoneInfoRow>
            <ZoneInfoRow label="Position">
              <Text style={styles.zoneValue}>
                {formatCoordinate(zone?.lastAcceptedFix ?? null)}
              </Text>
            </ZoneInfoRow>
          </View>

          <View style={styles.zoneActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: hasArrived }}
              disabled={hasArrived}
              style={({ pressed }) => [
                styles.button,
                styles.buttonPrimary,
                hasArrived && styles.buttonDisabled,
                pressed && !hasArrived && styles.buttonPressed,
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
              <Text style={styles.buttonPrimaryText}>
                {hasArrived ? 'Arrived' : 'Arrive'}
              </Text>
            </Pressable>

            {arriveError ? (
              <Text style={styles.errorText}>{arriveError}</Text>
            ) : null}
          </View>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Stops</Text>
      <View style={styles.stopList}>
        {routeStops.map((stop, index) => (
          <StopRow
            key={stop.id}
            stop={stop}
            activeStopId={activeStopId}
            completedStopIds={completedStopIds}
            isLast={index === routeStops.length - 1}
          />
        ))}
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canOpenPod }}
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

        {!canOpenPod ? (
          <Text style={styles.helperText}>
            {activeStop
              ? 'Arrive at this stop to open proof of delivery.'
              : 'No active stop — proof of delivery is unavailable.'}
          </Text>
        ) : null}

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
