import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OutboxScreen } from '@/features/outbox/screens';
import { ProofOfDeliveryScreen } from '@/features/pod/screens';
import { RouteScreen } from '@/features/route/screens';
import type { RootStackParamList } from '@/navigation/types';
import { colors } from '@/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const childScreenOptions = {
  headerShown: true,
  headerTintColor: colors.primary,
  headerStyle: {
    backgroundColor: colors.background,
  },
  headerShadowVisible: false,
  headerBackTitleVisible: false,
} as const;

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Route"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Route" component={RouteScreen} />
        <Stack.Screen
          name="ProofOfDelivery"
          component={ProofOfDeliveryScreen}
          options={{
            ...childScreenOptions,
            title: 'Proof of Delivery',
          }}
        />
        <Stack.Screen
          name="Outbox"
          component={OutboxScreen}
          options={{
            ...childScreenOptions,
            title: 'Outbox',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
