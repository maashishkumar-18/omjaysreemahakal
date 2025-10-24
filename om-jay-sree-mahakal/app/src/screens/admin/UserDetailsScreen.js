import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Card, Title, Paragraph, Text, Button, Chip, ActivityIndicator, Divider } from 'react-native-paper';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import moment from 'moment';

import { adminService } from '../../services/adminService';

const UserDetailsScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserDetails();
  }, [userId]);

  const loadUserDetails = async () => {
    try {
      const response = await adminService.getUserDetails(userId);
      setUserDetails(response.data);
    } catch (error) {
      console.error('Error loading user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (isActive) => {
    try {
      await adminService.updateUserStatus(userId, isActive);
      // Reload user details
      await loadUserDetails();
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>Loading user details...</Text>
      </View>
    );
  }

  if (!userDetails) {
    return (
      <View style={styles.center}>
        <Icon name="error-outline" size={64} color="#ccc" />
        <Text style={styles.errorText}>User not found</Text>
      </View>
    );
  }

  const { user, profile, loans } = userDetails;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>User Details</Text>
        <Text style={styles.subtitle}>
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Information
        </Text>
      </View>

      {/* Profile Card */}
      <Card style={styles.profileCard}>
        <Card.Content>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile.name?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Title style={styles.name}>{profile.name}</Title>
              <View style={styles.profileMeta}>
                <Chip
                  mode="outlined"
                  style={styles.roleChip}
                  textStyle={styles.chipText}
                >
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Chip>
                <Chip
                  mode="flat"
                  style={user.isActive ? styles.activeChip : styles.inactiveChip}
                  textStyle={[styles.chipText, { color: '#fff' }]}
                >
                  {user.isActive ? 'Active' : 'Inactive'}
                </Chip>
              </View>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <Icon name="person" size={16} color="#666" />
              <Text style={styles.contactLabel}>Username:</Text>
              <Text style={styles.contactValue}>{user.username}</Text>
            </View>

            <View style={styles.contactItem}>
              <Icon name="phone" size={16} color="#666" />
              <Text style={styles.contactLabel}>Phone:</Text>
              <Text style={styles.contactValue}>{profile.phoneNumber}</Text>
            </View>

            {user.role === 'borrower' && profile.address && (
              <View style={styles.contactItem}>
                <Icon name="home" size={16} color="#666" />
                <Text style={styles.contactLabel}>Address:</Text>
                <Text style={styles.contactValue} numberOfLines={2}>
                  {profile.address}
                </Text>
              </View>
            )}

            {user.role === 'lender' && profile.upiId && (
              <View style={styles.contactItem}>
                <Icon name="payment" size={16} color="#666" />
                <Text style={styles.contactLabel}>UPI ID:</Text>
                <Text style={styles.contactValue}>{profile.upiId}</Text>
              </View>
            )}

            <View style={styles.contactItem}>
              <Icon name="calendar-today" size={16} color="#666" />
              <Text style={styles.contactLabel}>Joined:</Text>
              <Text style={styles.contactValue}>
                {moment(user.createdAt).format('DD MMM YYYY')}
              </Text>
            </View>

            <View style={styles.contactItem}>
              <Icon name="update" size={16} color="#666" />
              <Text style={styles.contactLabel}>Last Login:</Text>
              <Text style={styles.contactValue}>
                {user.lastLogin ? moment(user.lastLogin).format('DD MMM YYYY') : 'Never'}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Lender QR Code */}
      {user.role === 'lender' && profile.upiQrCodeUrl && (
        <Card style={styles.qrCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>UPI QR Code</Title>
            <View style={styles.qrContainer}>
              <Image 
                source={{ uri: profile.upiQrCodeUrl }} 
                style={styles.qrCode}
                resizeMode="contain"
              />
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Loan History */}
      <Card style={styles.loansCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>
            Loan History ({loans.length})
          </Title>
          
          {loans.length > 0 ? (
            loans.map((loan, index) => (
              <View key={loan._id} style={styles.loanItem}>
                <View style={styles.loanInfo}>
                  <Text style={styles.loanId}>{loan.loanId}</Text>
                  <Text style={styles.loanAmount}>
                    ₹{loan.principalAmount?.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.loanMeta}>
                  <Chip 
                    mode="outlined" 
                    style={[
                      styles.loanStatus,
                      loan.status === 'active' && styles.activeLoan,
                      loan.status === 'closed' && styles.closedLoan,
                      loan.status === 'defaulted' && styles.defaultedLoan,
                    ]}
                    textStyle={{ fontSize: 10 }}
                  >
                    {loan.status.toUpperCase()}
                  </Chip>
                  <Button 
                    mode="text" 
                    compact
                    onPress={() => navigation.navigate('LoanDetails', { loanId: loan._id })}
                    style={styles.loanButton}
                  >
                    View
                  </Button>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyLoans}>
              <Icon name="account-balance-wallet" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No loans found</Text>
              <Text style={styles.emptySubtext}>
                {user.role === 'borrower' 
                  ? 'This borrower has no loans yet' 
                  : 'This lender has no assigned loans'
                }
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          mode={user.isActive ? "outlined" : "contained"}
          onPress={() => handleStatusUpdate(!user.isActive)}
          style={styles.statusButton}
          textColor={user.isActive ? '#d32f2f' : '#388e3c'}
          icon={user.isActive ? 'block' : 'check-circle'}
        >
          {user.isActive ? 'Deactivate User' : 'Activate User'}
        </Button>

        {user.role === 'borrower' && (
          <Button
            mode="contained"
            onPress={() => navigation.navigate('CreateLoan', { preselectedBorrower: userId })}
            style={styles.createLoanButton}
            icon="add-business"
          >
            Create Loan for this Borrower
          </Button>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  profileCard: {
    marginBottom: 16,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1a237e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 8,
  },
  profileMeta: {
    flexDirection: 'row',
  },
  roleChip: {
    marginRight: 8,
    height: 30,
  },
  activeChip: {
    backgroundColor: '#388e3c',
    height: 30,
  },
  inactiveChip: {
    backgroundColor: '#d32f2f',
    height: 30,
  },
  divider: {
    marginVertical: 16,
  },
  contactInfo: {
    marginTop: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    marginRight: 8,
    width: 80,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
    flex: 1,
  },
  qrCard: {
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 16,
  },
  qrContainer: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  qrCode: {
    width: 200,
    height: 200,
  },
  loansCard: {
    marginBottom: 16,
    elevation: 2,
  },
  loanItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  loanInfo: {
    flex: 1,
  },
  loanId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 2,
  },
  loanAmount: {
    fontSize: 12,
    color: '#666',
  },
  loanMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loanStatus: {
    marginRight: 8,
    height: 24,
  },
  activeLoan: {
    borderColor: '#388e3c',
  },
  closedLoan: {
    borderColor: '#666',
  },
  defaultedLoan: {
    borderColor: '#d32f2f',
  },
  loanButton: {
    minWidth: 60,
  },
  emptyLoans: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  actions: {
    marginBottom: 20,
  },
  statusButton: {
    marginBottom: 12,
  },
  createLoanButton: {
    backgroundColor: '#1a237e',
  },
  chipText: {
    fontSize: 12,
  },
});

export default UserDetailsScreen;
