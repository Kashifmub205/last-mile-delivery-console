import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { findActiveStop, getStopStatus } from '@/domain/route/routeProgress';
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
  const completeStop = useRouteProgressStore(state => state.completeStop);

  const activeStop = findActiveStop(routeStops, activeStopId);

  if (!hasHydrated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.subtitle}>Loading route progress…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Route</Text>
      <Text style={styles.subtitle}>
        Active stop: {activeStop?.customerName ?? 'None'}
      </Text>

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
          disabled={!activeStop}
          style={({ pressed }) => [
            styles.button,
            styles.buttonPrimary,
            !activeStop && styles.buttonDisabled,
            pressed && activeStop && styles.buttonPressed,
          ]}
          onPress={() => {
            if (!activeStop) {
              return;
            }

            completeStop(activeStop.id, routeStops);
          }}
        >
          <Text style={styles.buttonPrimaryText}>
            Complete {activeStop?.id ?? 'stop'}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          disabled={!activeStop}
          style={({ pressed }) => [
            styles.button,
            styles.buttonSecondary,
            !activeStop && styles.buttonDisabled,
            pressed && activeStop && styles.buttonPressed,
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
          <Text style={styles.buttonSecondaryText}>Open Proof of Delivery</Text>
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
    </View>
  );
}
