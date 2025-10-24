import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Platform, View, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { Text, TouchableRipple } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import BorrowerDashboard from '../screens/borrower/BorrowerDashboard';
import MakePaymentScreen from '../screens/borrower/MakePaymentScreen';
import PaymentHistoryScreen from '../screens/borrower/PaymentHistoryScreen';
import LenderQRCodeScreen from '../screens/borrower/LenderQRCodeScreen';
import LoanDetailsScreen from '../screens/borrower/LoanDetailsScreen';

import { logout } from '../store/slices/authSlice';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

const BorrowerCustomDrawer = (props) => {
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.drawerSection}>
        {props.state.routes.map((route, index) => {
          const isFocused = props.state.index === index;

          return (
            <DrawerItem
              key={route.key}
              label={route.name}
              focused={isFocused}
              onPress={() => props.navigation.navigate(route.name)}
              icon={({ color, size }) => (
                <Icon name={getIconName(route.name)} color={color} size={size} />
              )}
            />
          );
        })}
      </View>

      <View style={styles.footer}>
        <TouchableRipple onPress={handleLogout} style={styles.logoutButton}>
          <View style={styles.logoutContent}>
            <Icon name="logout" size={24} color="#d32f2f" />
            <Text style={styles.logoutText}>Logout</Text>
          </View>
        </TouchableRipple>
      </View>
    </DrawerContentScrollView>
  );
};

const getIconName = (routeName) => {
  switch (routeName) {
    case 'Dashboard':
      return 'dashboard';
    case 'MakePayment':
      return 'payment';
    case 'PaymentHistory':
      return 'history';
    case 'LoanDetails':
      return 'info';
    default:
      return 'folder';
  }
};

const BorrowerDrawer = () => (
  <Drawer.Navigator
    drawerContent={(props) => <BorrowerCustomDrawer {...props} />}
    screenOptions={{
      drawerActiveTintColor: '#1a237e',
      drawerInactiveTintColor: '#666',
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
    <Drawer.Screen
      name="Dashboard"
      component={BorrowerDashboard}
      options={{
        drawerIcon: ({ color, size }) => (
          <Icon name="dashboard" color={color} size={size} />
        ),
        title: 'My Dashboard',
      }}
    />
    <Drawer.Screen
      name="MakePayment"
      component={MakePaymentScreen}
      options={{
        drawerIcon: ({ color, size }) => (
          <Icon name="payment" color={color} size={size} />
        ),
        title: 'Make Payment',
      }}
    />
    <Drawer.Screen
      name="PaymentHistory"
      component={PaymentHistoryScreen}
      options={{
        drawerIcon: ({ color, size }) => (
          <Icon name="history" color={color} size={size} />
        ),
        title: 'Payment History',
      }}
    />
    <Drawer.Screen
      name="LoanDetails"
      component={LoanDetailsScreen}
      options={{
        drawerIcon: ({ color, size }) => (
          <Icon name="info" color={color} size={size} />
        ),
        title: 'Loan Details',
      }}
    />
  </Drawer.Navigator>
);

const BorrowerNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        contentStyle: Platform.OS === 'web' ? { minHeight: '100vh' } : undefined,
      }}
    >
      <Stack.Screen
        name="BorrowerDrawer"
        component={BorrowerDrawer}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LenderQRCode"
        component={LenderQRCodeScreen}
        options={{ title: 'Lender QR Code' }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerSection: {
    marginTop: 10,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingVertical: 10,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#d32f2f',
    fontWeight: '500',
  },
});

export default BorrowerNavigator;
