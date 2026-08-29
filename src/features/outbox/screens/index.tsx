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
import type { OutboxDelivery, OutboxState } from '@/types/outbox';
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

const stateChipBox: Record<OutboxState, object> = {
  QUEUED: styles.chipNeutral,
  SYNCING: styles.chipPrimary,
  RETRYING: styles.chipWarning,
  FAILED: styles.chipError,
  SYNCED: styles.chipSuccess,
};

const stateChipText: Record<OutboxState, object> = {
  QUEUED: styles.chipTextNeutral,
  SYNCING: styles.chipTextPrimary,
  RETRYING: styles.chipTextWarning,
  FAILED: styles.chipTextError,
  SYNCED: styles.chipTextSuccess,
};

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function DeliveryCard({
  delivery,
  onRetry,
}: {
  delivery: OutboxDelivery;
  onRetry: (clientDeliveryId: string) => void;
}) {
  return (
    <View
      style={[styles.card, delivery.state === 'FAILED' && styles.cardFailed]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Stop {delivery.stopId}</Text>
        <View style={[styles.chip, stateChipBox[delivery.state]]}>
          <Text style={[styles.chipText, stateChipText[delivery.state]]}>
            {delivery.state}
          </Text>
        </View>
      </View>

      <MetaRow label="Created" value={formatTimestamp(delivery.createdAt)} />
      <MetaRow label="Retries" value={String(delivery.retryCount)} />
      {delivery.nextRetryAt ? (
        <MetaRow
          label="Next retry"
          value={formatTimestamp(delivery.nextRetryAt)}
        />
      ) : null}

      {delivery.lastError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorBoxLabel}>Failure reason</Text>
          <Text style={styles.cardError}>{delivery.lastError}</Text>
        </View>
      ) : null}

      {delivery.state === 'FAILED' ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => onRetry(delivery.clientDeliveryId)}
          style={({ pressed }) => [
            styles.button,
            styles.buttonPrimary,
            styles.cardAction,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonPrimaryText}>Retry</Text>
        </Pressable>
      ) : null}

      <Text style={styles.cardMeta} selectable>
        Idempotency · {delivery.clientDeliveryId}
      </Text>
    </View>
  );
}

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
  const syncDisabled = !hasHydrated || passInProgress || !hasEligibleDelivery;

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
          accessibilityState={{ disabled: syncDisabled }}
          disabled={syncDisabled}
          onPress={handleSyncNext}
          style={({ pressed }) => [
            styles.button,
            styles.buttonPrimary,
            syncDisabled && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonPrimaryText}>
            {passInProgress ? 'Syncing…' : 'Sync now'}
          </Text>
        </Pressable>
        {hasHydrated &&
        !passInProgress &&
        !hasEligibleDelivery &&
        sortedDeliveries.length > 0 ? (
          <Text style={styles.syncHint}>No eligible deliveries to sync.</Text>
        ) : null}
      </View>

      {!hasHydrated ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Loading outbox…</Text>
        </View>
      ) : sortedDeliveries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Outbox is empty</Text>
          <Text style={styles.emptyText}>
            Completed deliveries appear here until they sync to the server.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {sortedDeliveries.map(delivery => (
            <DeliveryCard
              key={delivery.clientDeliveryId}
              delivery={delivery}
              onRetry={retryFailedDelivery}
            />
          ))}
        </View>
      )}

      <View style={styles.devPanel}>
        <Text style={styles.devPanelTitle}>Dev / debug: mock failure mode</Text>
        <Text style={styles.devPanelHint}>
          Deterministic server failures for retry testing only. Not part of the
          courier workflow.
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
    </ScrollView>
  );
}
