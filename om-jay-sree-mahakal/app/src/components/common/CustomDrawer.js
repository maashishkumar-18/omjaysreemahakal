import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { Text, Avatar, TouchableRipple } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { logout } from '../../store/slices/authSlice';

const CustomDrawer = (props) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <DrawerContentScrollView {...props} style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={{ uri: 'https://rukminim2.flixcart.com/image/480/480/xif0q/poster/a/5/r/small-spos8922-poster-lord-shiva-ji-maa-parvati-ji-photo-sl-9926-original-imaghs6bnqvasbfu.jpeg?q=90' }}
          style={styles.logo}
        />
        <Text style={styles.appName}>Om Jay Sree Mahakal</Text>
        <View style={styles.userInfo}>
          <Avatar.Text 
            size={40} 
            label={user?.profile?.name?.charAt(0) || user?.username?.charAt(0) || 'U'} 
            style={styles.avatar}
          />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.profile?.name || user?.username}</Text>
            <Text style={styles.userRole}>{user?.role?.toUpperCase()}</Text>
          </View>
        </View>
      </View>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignSelf: 'center',
    marginBottom: 10,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1a237e',
    marginBottom: 15,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#1a237e',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  userRole: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
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

export default CustomDrawer;