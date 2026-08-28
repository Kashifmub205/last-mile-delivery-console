import { Text, View } from 'react-native';
import { styles } from './styles';

export function OutboxScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Outbox</Text>
      <Text style={styles.subtitle}>
        Delivery sync states, retries, and manual sync.
      </Text>
    </View>
  );
}
