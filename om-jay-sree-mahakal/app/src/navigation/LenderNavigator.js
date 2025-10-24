import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import LenderDashboard from '../screens/lender/LenderDashboard';
import LenderLoansScreen from '../screens/lender/LenderLoanScreen';
import LoanPaymentsScreen from '../screens/lender/LoanPaymentsScreen';
import LenderProfileScreen from '../screens/lender/LenderProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const LenderTabs = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: '#1a237e',
      tabBarInactiveTintColor: '#666',
      tabBarStyle: {
        paddingBottom: 5,
        paddingTop: 5,
        height: 60,
      },
      headerStyle: {
        backgroundColor: '#1a237e',
      },
      headerTintColor: '#ffffff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
      sceneStyle: Platform.OS === 'web' ? { minHeight: '100vh' } : undefined,
    }}
  >
    <Tab.Screen 
      name="Dashboard" 
      component={LenderDashboard}
      options={{
        tabBarIcon: ({ color, size }) => (
          <Icon name="dashboard" color={color} size={size} />
        ),
        title: 'Lender Dashboard',
      }}
    />
    <Tab.Screen 
      name="MyLoans" 
      component={LenderLoansScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <Icon name="account-balance" color={color} size={size} />
        ),
        title: 'My Loans',
      }}
    />
    <Tab.Screen 
      name="Profile" 
      component={LenderProfileScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <Icon name="person" color={color} size={size} />
        ),
        title: 'My Profile',
      }}
    />
  </Tab.Navigator>
);

const LenderNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        contentStyle: Platform.OS === 'web' ? { minHeight: '100vh' } : undefined,
      }}
    >
      <Stack.Screen
        name="LenderTabs"
        component={LenderTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LoanPayments"
        component={LoanPaymentsScreen}
        options={{ title: 'Loan Payments' }}
      />
    </Stack.Navigator>
  );
};

export default LenderNavigator;