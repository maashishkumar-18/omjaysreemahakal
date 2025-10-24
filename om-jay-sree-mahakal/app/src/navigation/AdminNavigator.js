import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Platform, View, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { Text, TouchableRipple } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import AdminDashboard from '../screens/admin/AdminDashboard';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import LoanManagementScreen from '../screens/admin/LoanManagementScreen';
import PaymentApprovalScreen from '../screens/admin/PaymentApprovalScreen';
import CreateUserScreen from '../screens/admin/CreateUserScreen';
import CreateLoanScreen from '../screens/admin/CreateLoanScreen';
import UserDetailsScreen from '../screens/admin/UserDetailsScreen';
import LoanDetailsScreen from '../screens/admin/LoanDetailsScreen';

import { logout } from '../store/slices/authSlice';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

const AdminCustomDrawer = (props) => {
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
    case 'User Management':
      return 'people';
    case 'Loan Management':
      return 'account-balance';
    case 'Payment Approval':
      return 'payment';
    default:
      return 'folder';
  }
};

const AdminDrawer = () => (
  <Drawer.Navigator
    drawerContent={(props) => <AdminCustomDrawer {...props} />}
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
      component={AdminDashboard}
      options={{
        drawerIcon: ({ color, size }) => (
          <Icon name="dashboard" color={color} size={size} />
        ),
        title: 'Admin Dashboard',
      }}
    />
    <Drawer.Screen
      name="User Management"
      component={UserManagementScreen}
      options={{
        drawerIcon: ({ color, size }) => (
          <Icon name="people" color={color} size={size} />
        ),
        title: 'User Management',
      }}
    />
    <Drawer.Screen
      name="Loan Management"
      component={LoanManagementScreen}
      options={{
        drawerIcon: ({ color, size }) => (
          <Icon name="account-balance" color={color} size={size} />
        ),
        title: 'Loan Management',
      }}
    />
    <Drawer.Screen
      name="Payment Approval"
      component={PaymentApprovalScreen}
      options={{
        drawerIcon: ({ color, size }) => (
          <Icon name="payment" color={color} size={size} />
        ),
        title: 'Payment Approval',
      }}
    />
  </Drawer.Navigator>
);

const AdminNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        contentStyle: Platform.OS === 'web' ? { minHeight: '100vh' } : undefined,
      }}
    >
      <Stack.Screen
        name="AdminDrawer"
        component={AdminDrawer}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UserDetails"
        component={UserDetailsScreen}
        options={{ title: 'User Details' }}
      />
      <Stack.Screen
        name="LoanDetails"
        component={LoanDetailsScreen}
        options={{ title: 'Loan Details' }}
      />
      <Stack.Screen
        name="CreateUser"
        component={CreateUserScreen}
        options={{ title: 'Create User' }}
      />
      <Stack.Screen
        name="CreateLoan"
        component={CreateLoanScreen}
        options={{ title: 'Create Loan' }}
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
  }
})

export default AdminNavigator;
