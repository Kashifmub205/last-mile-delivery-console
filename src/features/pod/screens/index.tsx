import { Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { styles } from './styles';

type Props = NativeStackScreenProps<RootStackParamList, 'ProofOfDelivery'>;

export function ProofOfDeliveryScreen({ navigation, route }: Props) {
  const { stopId, templateId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Proof of Delivery</Text>
      <Text style={styles.subtitle}>
        Stop {stopId} · Template {templateId}
      </Text>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.button,
            styles.buttonPrimary,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => navigation.navigate('Outbox')}
        >
          <Text style={styles.buttonPrimaryText}>Submit (placeholder)</Text>
        </Pressable>
      </View>
    </View>
  );
}
