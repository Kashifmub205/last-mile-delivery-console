import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  listOutboxDeliveries,
  selectNextEligibleDelivery,
} from '@/domain/outbox/outboxDelivery';
import { useOutboxStore } from '@/features/outbox/store/outboxStore';
import {
  isSyncPassInProgress,
  requestSyncPass,
  subscribeSyncPassInProgress,
} from '@/features/outbox/sync/syncCoordinator';
import {
  getMockDeliveryControls,
  setMockDeliveryControls,
  type MockDeliveryControlMode,
} from '@/mock/server/mockDeliveryControls';
import { styles } from './styles';

function formatTimestamp(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

const MOCK_MODE_LABELS: Record<MockDeliveryControlMode, string> = {
  none: 'Normal',
  network: 'Network fail',
  '400': '400 fail',
  '500': '500 fail',
  fail_first_n: 'Fail first 3',
};

export function OutboxScreen() {
  const [passInProgress, setPassInProgress] = useState(isSyncPassInProgress);
  const [mockMode, setMockMode] = useState(getMockDeliveryControls().mode);

  useEffect(() => subscribeSyncPassInProgress(setPassInProgress), []);
  const hasHydrated = useOutboxStore(state => state.hasHydrated);
  const deliveries = useOutboxStore(state => state.deliveries);
  const retryFailedDelivery = useOutboxStore(
    state => state.retryFailedDelivery,
  );
  const sortedDeliveries = useMemo(
    () => listOutboxDeliveries(deliveries),
    [deliveries],
  );
  const hasEligibleDelivery = useMemo(
    () => selectNextEligibleDelivery(deliveries) !== null,
    [deliveries],
  );

  const handleSyncNext = () => {
    void requestSyncPass();
  };

  const handleSetMockMode = (mode: MockDeliveryControlMode) => {
    if (mode === '400') {
      setMockDeliveryControls({
        mode,
        message: 'Invalid stop payload',
      });
    } else if (mode === '500') {
      setMockDeliveryControls({
        mode,
        message: 'Mock server unavailable',
      });
    } else if (mode === 'fail_first_n') {
      setMockDeliveryControls({
        mode,
        message: 'Mock transient failure',
        failFirstN: 3,
      });
    } else {
      setMockDeliveryControls({ mode });
    }

    setMockMode(mode);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Outbox</Text>
      <Text style={styles.subtitle}>
        Manual sync with retry rules. Deliveries sync automatically when online.
      </Text>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          disabled={!hasHydrated || passInProgress || !hasEligibleDelivery}
          onPress={handleSyncNext}
          style={({ pressed }) => [
            styles.button,
            styles.buttonPrimary,
            (!hasHydrated || passInProgress || !hasEligibleDelivery) &&
              styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonPrimaryText}>
            {passInProgress ? 'Syncing…' : 'Sync now'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.devPanel}>
        <Text style={styles.devPanelTitle}>Dev / debug: mock failure mode</Text>
        <Text style={styles.devPanelHint}>
          Deterministic server failures for retry testing only.
        </Text>
        {(Object.keys(MOCK_MODE_LABELS) as MockDeliveryControlMode[]).map(
          mode => (
            <Pressable
              key={mode}
              accessibilityRole="button"
              onPress={() => handleSetMockMode(mode)}
              style={({ pressed }) => [
                styles.button,
                styles.buttonSecondary,
                mockMode === mode && styles.buttonSelected,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.buttonSecondaryText}>
                {MOCK_MODE_LABELS[mode]}
              </Text>
            </Pressable>
          ),
        )}
      </View>

      {!hasHydrated ? (
        <Text style={styles.emptyText}>Loading outbox…</Text>
      ) : sortedDeliveries.length === 0 ? (
        <Text style={styles.emptyText}>No deliveries in the outbox yet.</Text>
      ) : (
        sortedDeliveries.map(delivery => (
          <View key={delivery.clientDeliveryId} style={styles.card}>
            <Text style={styles.cardTitle}>Stop {delivery.stopId}</Text>
            <Text style={styles.cardLine}>Status: {delivery.state}</Text>
            <Text style={styles.cardLine}>
              Created: {formatTimestamp(delivery.createdAt)}
            </Text>
            <Text style={styles.cardLine}>Retries: {delivery.retryCount}</Text>
            {delivery.nextRetryAt ? (
              <Text style={styles.cardLine}>
                Next retry: {formatTimestamp(delivery.nextRetryAt)}
              </Text>
            ) : null}
            {delivery.lastError ? (
              <Text style={styles.cardError}>Error: {delivery.lastError}</Text>
            ) : null}
            {delivery.state === 'FAILED' ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => retryFailedDelivery(delivery.clientDeliveryId)}
                style={({ pressed }) => [
                  styles.button,
                  styles.buttonSecondary,
                  styles.cardAction,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.buttonSecondaryText}>Retry</Text>
              </Pressable>
            ) : null}
            <Text style={styles.cardMeta}>
              Idempotency key: {delivery.clientDeliveryId}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}
