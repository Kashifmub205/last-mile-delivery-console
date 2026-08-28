import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { resolveCompletionLocation } from '@/domain/location/completionLocation';
import { getLatestAcceptedFixForStop } from '@/features/location/activeStopLocation';
import { sanitizePodAnswers } from '@/domain/pod/sanitizeAnswers';
import type { PodAnswers } from '@/domain/pod/types';
import { validatePodForm } from '@/domain/pod/validation';
import { isFieldVisible } from '@/domain/pod/visibility';
import { completeLocalDelivery } from '@/features/pod/completeLocalDelivery';
import { PodFieldRenderer } from '@/features/pod/components/PodFieldRenderer';
import { POD_TEMPLATE_FIXTURE_BY_ID, ROUTE_FIXTURE } from '@/mock/fixtures';
import type { RootStackParamList } from '@/navigation/types';
import type { PodAnswerValue } from '@/types/pod';
import { styles } from './styles';

type Props = NativeStackScreenProps<RootStackParamList, 'ProofOfDelivery'>;
type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ProofOfDelivery'
>;

const routeStops = ROUTE_FIXTURE.stops;

export function ProofOfDeliveryScreen({ route }: Props) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { stopId, templateId } = route.params;
  const template = POD_TEMPLATE_FIXTURE_BY_ID[templateId];
  const [answers, setAnswers] = useState<PodAnswers>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
    if (!template) {
      return;
    }

    const errors = validatePodForm(template.fields, answers);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    const stop = routeStops.find(routeStop => routeStop.id === stopId);
    if (!stop) {
      return;
    }

    const sanitized = sanitizePodAnswers(template, answers);
    const result = completeLocalDelivery(routeStops, {
      routeId: ROUTE_FIXTURE.routeId,
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

    navigation.navigate('Route');
  }, [answers, navigation, stopId, template]);

  if (!template) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.title}>Proof of Delivery</Text>
        <Text style={styles.subtitle}>Template not found: {templateId}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
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
