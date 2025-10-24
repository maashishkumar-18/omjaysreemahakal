import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import {View} from 'react-native';

import { store, persistor } from '../src/store/store';
import AppNavigator from '../src/navigation/AppNavigator';
import { theme } from '../src/constants/theme';
import LoadingScreen from '../src/components/common/LoadingScreen';

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <PaperProvider theme={theme}>
            <View style={{ flex: 1, minHeight: '100vh' }}>
              <StatusBar style="auto" />
              <AppNavigator />
            </View>
        </PaperProvider>
      </PersistGate>
    </Provider>
  );
}
