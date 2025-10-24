import React from 'react';
import { useSelector } from 'react-redux';
import { createStackNavigator } from '@react-navigation/stack';
import { View, StyleSheet, Platform } from 'react-native';

import AuthNavigator from './AuthNavigator';
import AdminNavigator from './AdminNavigator';
import LenderNavigator from './LenderNavigator';
import BorrowerNavigator from './BorrowerNavigator';
import SplashScreen from '../screens/auth/SplashScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  return (
    <View style={styles.container}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : user?.role === 'admin' ? (
          <Stack.Screen name="Admin" component={AdminNavigator} />
        ) : user?.role === 'lender' ? (
          <Stack.Screen name="Lender" component={LenderNavigator} />
        ) : (
          <Stack.Screen name="Borrower" component={BorrowerNavigator} />
        )}
      </Stack.Navigator>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: Platform.OS === 'web' ? '100vh' : undefined,
  },
});

export default AppNavigator;