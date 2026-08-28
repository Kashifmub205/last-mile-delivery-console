import { StatusBar, StyleSheet, View } from 'react-native';
import { AppProviders } from '@/AppProviders';
import { RootNavigator } from '@/navigation/RootNavigator';

function App() {
  return (
    <View style={styles.root}>
      <AppProviders>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" />
        <RootNavigator />
      </AppProviders>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default App;
