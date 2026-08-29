import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPodTemplate, getRoute } from '@/api/deliveryApi';
import { resolveCompletionLocation } from '@/domain/location/completionLocation';
import { getLatestAcceptedFixForStop } from '@/features/location/activeStopLocation';
import { sanitizePodAnswers } from '@/domain/pod/sanitizeAnswers';
import type { PodAnswers } from '@/domain/pod/types';
import { validatePodForm } from '@/domain/pod/validation';
import { isFieldVisible } from '@/domain/pod/visibility';
import { completeLocalDelivery } from '@/features/pod/completeLocalDelivery';
import { PodFieldRenderer } from '@/features/pod/components/PodFieldRenderer';
import type { RootStackParamList } from '@/navigation/types';
import type { PodAnswerValue, PodTemplate } from '@/types/pod';
import type { Route } from '@/types/route';
import { styles } from './styles';

type Props = NativeStackScreenProps<RootStackParamList, 'ProofOfDelivery'>;
type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ProofOfDelivery'
>;

export function ProofOfDeliveryScreen({ route }: Props) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { stopId, templateId } = route.params;
  const [template, setTemplate] = useState<PodTemplate | null>(null);
  const [routeData, setRouteData] = useState<Route | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [answers, setAnswers] = useState<PodAnswers>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [templateResult, routeResult] = await Promise.all([
        getPodTemplate(templateId),
        getRoute(),
      ]);

      if (cancelled) {
        return;
      }

      if (!templateResult.ok) {
        setTemplate(null);
        setRouteData(null);
        setLoadError(templateResult.error.message);
        setIsLoading(false);
        return;
      }

      if (!routeResult.ok) {
        setTemplate(null);
        setRouteData(null);
        setLoadError(routeResult.error.message);
        setIsLoading(false);
        return;
      }

      setTemplate(templateResult.data);
      setRouteData(routeResult.data);
      setLoadError(null);
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [templateId]);

  const updateAnswer = useCallback((fieldId: string, value: PodAnswerValue) => {
    setAnswers(current => ({
      ...current,
      [fieldId]: value,
    }));
    setFieldErrors(current => {
      if (!current[fieldId]) {
        return current;
      }

      const next = { ...current };
      delete next[fieldId];
      return next;
    });
  }, []);

  const handleCompleteDelivery = useCallback(() => {
    if (!template || !routeData) {
      return;
    }

    const errors = validatePodForm(template.fields, answers);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const stop = routeData.stops.find(routeStop => routeStop.id === stopId);
    if (!stop) {
      return;
    }

    const sanitized = sanitizePodAnswers(template, answers);
    const result = completeLocalDelivery(routeData.stops, {
      routeId: routeData.routeId,
      stopId,
      templateId: template.templateId,
      completedAt: new Date().toISOString(),
      location: resolveCompletionLocation(
        stop,
        getLatestAcceptedFixForStop(stopId),
      ),
      response: sanitized,
    });

    if (result.outcome === 'not_active_stop') {
      return;
    }

    navigation.navigate('Route', { deliverySavedLocally: true });
  }, [answers, navigation, routeData, stopId, template]);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.subtitle}>Loading proof of delivery…</Text>
      </View>
    );
  }

  if (loadError || !template || !routeData) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.title}>Proof of Delivery</Text>
        <Text style={styles.subtitle}>
          {loadError ?? `Template not found: ${templateId}`}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Text style={styles.title}>{template.name}</Text>
        <Text style={styles.subtitle}>
          Stop {stopId} · {template.templateId}
        </Text>

        <View style={styles.form}>
          {template.fields.map(field => {
            if (!isFieldVisible(field, answers)) {
              return null;
            }

            return (
              <PodFieldRenderer
                key={field.id}
                field={field}
                value={answers[field.id]}
                onChange={value => updateAnswer(field.id, value)}
                error={fieldErrors[field.id]}
              />
            );
          })}
        </View>

        <View style={styles.actions}>
          {hasFieldErrors ? (
            <Text style={styles.formError}>
              Fix the highlighted fields to complete delivery.
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.button,
              styles.buttonPrimary,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleCompleteDelivery}
          >
            <Text style={styles.buttonPrimaryText}>Complete Delivery</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
