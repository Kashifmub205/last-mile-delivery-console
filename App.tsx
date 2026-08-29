import { StatusBar, StyleSheet, View } from 'react-native';
import { AppProviders } from '@/AppProviders';
import { RootNavigator } from '@/navigation/RootNavigator';
import { colors } from '@/theme';

function App() {
  return (
    <View style={styles.root}>
      <AppProviders>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={colors.background}
        />
        <RootNavigator />
      </AppProviders>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

export default App;
