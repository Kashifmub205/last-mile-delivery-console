import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OutboxScreen } from '@/features/outbox/screens';
import { ProofOfDeliveryScreen } from '@/features/pod/screens';
import { RouteScreen } from '@/features/route/screens';
import type { RootStackParamList } from '@/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Route"
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name="Route" component={RouteScreen} />
        <Stack.Screen name="ProofOfDelivery" component={ProofOfDeliveryScreen} />
        <Stack.Screen name="Outbox" component={OutboxScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
