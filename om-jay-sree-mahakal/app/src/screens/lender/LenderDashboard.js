import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Text, Button, Chip, ActivityIndicator } from 'react-native-paper';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { loanService } from '../../services/loanService';

const LenderDashboard = ({ navigation }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useSelector((state) => state.auth);

  const loadDashboardData = async () => {
    try {
      const response = await loanService.getLenderDashboard();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error loading lender dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Welcome, {user?.profile?.name || user?.username}!
        </Text>
        <Text style={styles.subtitle}>Lender Dashboard</Text>
      </View>

      {/* Lender Summary */}
      <Card style={styles.summaryCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>Your Lending Summary</Title>
          
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Icon name="account-balance" size={24} color="#1a237e" />
              <View style={styles.summaryText}>
                <Text style={styles.summaryNumber}>
                  ₹{dashboardData?.lender?.totalAmountLent?.toLocaleString() || 0}
                </Text>
                <Text style={styles.summaryLabel}>Total Lent</Text>
              </View>
            </View>

            <View style={styles.summaryItem}>
              <Icon name="trending-up" size={24} color="#1a237e" />
              <View style={styles.summaryText}>
                <Text style={styles.summaryNumber}>
                  ₹{dashboardData?.lender?.totalEarnings?.toLocaleString() || 0}
                </Text>
                <Text style={styles.summaryLabel}>Total Earnings</Text>
              </View>
            </View>

            <View style={styles.summaryItem}>
              <Icon name="list-alt" size={24} color="#1a237e" />
              <View style={styles.summaryText}>
                <Text style={styles.summaryNumber}>
                  {dashboardData?.lender?.activeLoansCount || 0}
                </Text>
                <Text style={styles.summaryLabel}>Active Loans</Text>
              </View>
            </View>

            <View style={styles.summaryItem}>
              <Icon name="payments" size={24} color="#1a237e" />
              <View style={styles.summaryText}>
                <Text style={styles.summaryNumber}>
                  ₹{dashboardData?.summary?.totalAmountRecoverable?.toLocaleString() || 0}
                </Text>
                <Text style={styles.summaryLabel}>To Recover</Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Active Loans Preview */}
      <Card style={styles.loansCard}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title style={styles.cardTitle}>Active Loans</Title>
            <Button 
              mode="text" 
              onPress={() => navigation.navigate('MyLoans')}
              compact
            >
              View All
            </Button>
          </View>

          {dashboardData?.activeLoans && dashboardData.activeLoans.length > 0 ? (
            dashboardData.activeLoans.slice(0, 3).map((loan, index) => (
              <View key={loan._id} style={styles.loanItem}>
                <View style={styles.loanInfo}>
                  <Text style={styles.loanBorrower}>
                    {loan.borrowerId?.name}
                  </Text>
                  <Text style={styles.loanAmount}>
                    ₹{loan.principalAmount?.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.loanMeta}>
                  <Chip 
                    mode="outlined" 
                    style={styles.loanChip}
                    textStyle={{ fontSize: 10 }}
                  >
                    Balance: ₹{loan.remainingBalance?.toLocaleString()}
                  </Chip>
                  <Button 
                    mode="text" 
                    compact
                    onPress={() => navigation.navigate('LoanPayments', { loanId: loan._id })}
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
              <Text style={styles.emptyText}>No active loans</Text>
              <Text style={styles.emptySubtext}>
                Contact admin to get assigned loans
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Recent Payments */}
      <Card style={styles.paymentsCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>Recent Payments</Title>
          
          {dashboardData?.recentPayments && dashboardData.recentPayments.length > 0 ? (
            dashboardData.recentPayments.map((payment, index) => (
              <View key={payment._id} style={styles.paymentItem}>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentBorrower}>
                    {payment.borrowerId?.name}
                  </Text>
                  <Text style={styles.paymentAmount}>
                    ₹{payment.amount?.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.paymentMeta}>
                  <Text style={styles.paymentDate}>
                    {new Date(payment.adminApprovalDate).toLocaleDateString()}
                  </Text>
                  <Chip 
                    mode="flat"
                    style={styles.approvedChip}
                    textStyle={{ color: '#fff', fontSize: 10 }}
                  >
                    APPROVED
                  </Chip>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyPayments}>
              <Icon name="payments" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No recent payments</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <View style={styles.actionsGrid}>
        <Button
          mode="contained"
          icon="list-alt"
          onPress={() => navigation.navigate('MyLoans')}
          style={styles.actionButton}
          contentStyle={styles.buttonContent}
        >
          My Loans
        </Button>
        <Button
          mode="outlined"
          icon="person"
          onPress={() => navigation.navigate('Profile')}
          style={styles.actionButton}
          contentStyle={styles.buttonContent}
        >
          My Profile
        </Button>
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
  header: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  summaryCard: {
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  summaryText: {
    marginLeft: 12,
  },
  summaryNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
  },
  loansCard: {
    marginBottom: 16,
    elevation: 2,
  },
  paymentsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  loanBorrower: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#212121',
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
  loanChip: {
    marginRight: 8,
    height: 24,
  },
  loanButton: {
    minWidth: 60,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentBorrower: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 2,
  },
  paymentAmount: {
    fontSize: 12,
    color: '#388e3c',
    fontWeight: 'bold',
  },
  paymentMeta: {
    alignItems: 'flex-end',
  },
  paymentDate: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  approvedChip: {
    backgroundColor: '#388e3c',
    height: 20,
  },
  emptyLoans: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyPayments: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
  },
  buttonContent: {
    height: 44,
  },
});

export default LenderDashboard;