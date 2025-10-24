import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Text, Button, Chip, ActivityIndicator } from 'react-native-paper';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import moment from 'moment';

import { loanService } from '../../services/loanService';

const BorrowerDashboard = ({ navigation }) => {
  const [loanData, setLoanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useSelector((state) => state.auth);

  const loadLoanData = async () => {
    try {
      const response = await loanService.getBorrowerLoans();
      setLoanData(response.data);
    } catch (error) {
      console.error('Error loading loan data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLoanData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadLoanData();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#388e3c';
      case 'closed': return '#666';
      case 'defaulted': return '#d32f2f';
      default: return '#ff6f00';
    }
  };

  const getDaysRemaining = (loan) => {
  if (!loan || !loan.emiPerDay || !loan.totalDays || loan.emiPerDay === 0) return 0;

  const totalPayable = loan.emiPerDay * loan.totalDays;
  const remainingAmount = totalPayable - (loan.totalAmountRepaid || 0);
  const daysRemaining = remainingAmount / loan.emiPerDay;

  return Math.ceil(daysRemaining);
};

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>Loading Your Dashboard...</Text>
      </View>
    );
  }

  const activeLoan = loanData?.activeLoan;

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
        <Text style={styles.subtitle}>Your Loan Dashboard</Text>
      </View>

      {activeLoan ? (
        <>
          {/* Current Loan Overview */}
          <Card style={styles.loanCard}>
            <Card.Content>
              <View style={styles.loanHeader}>
                <Title style={styles.loanTitle}>Current Loan</Title>
                <Chip 
                  mode="flat" 
                  textStyle={{ color: '#fff', fontSize: 12 }}
                  style={[styles.statusChip, { backgroundColor: getStatusColor(activeLoan.status) }]}
                >
                  {activeLoan.status.toUpperCase()}
                </Chip>
              </View>

              <View style={styles.loanDetails}>
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Loan Amount</Text>
                    <Text style={styles.detailValue}>
                      ₹{activeLoan.principalAmount?.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>EMI Per Day</Text>
                    <Text style={styles.detailValue}>
                      ₹{activeLoan.emiPerDay?.toLocaleString()}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Remaining Balance</Text>
                    <Text style={[styles.detailValue, styles.remainingBalance]}>
                      ₹{activeLoan.remainingBalance?.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Total Paid</Text>
                    <Text style={[styles.detailValue, styles.totalPaid]}>
                      ₹{loanData?.paymentSummary?.totalPaid?.toLocaleString() || 0}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Repayment Progress</Text>
                  <Text style={styles.progressPercentage}>
                    {Math.round(((activeLoan.principalAmount - activeLoan.remainingBalance) / activeLoan.principalAmount) * 100)}%
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${((activeLoan.principalAmount - activeLoan.remainingBalance) / activeLoan.principalAmount) * 100}%` 
                      }
                    ]} 
                  />
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Payment Information */}
          <Card style={styles.infoCard}>
            <Card.Content>
              <Title style={styles.infoTitle}>Payment Information</Title>
              
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Icon name="calendar-today" size={20} color="#1a237e" />
                  <View style={styles.infoText}>
                    <Text style={styles.infoLabel}>Next Due Date</Text>
                    <Text style={styles.infoValue}>
                      {moment(activeLoan.nextDueDate).format('DD MMM YYYY')}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoItem}>
                  <Icon name="access-time" size={20} color="#1a237e" />
                  <View style={styles.infoText}>
                    <Text style={styles.infoLabel}>Days Remaining</Text>
                    <Text style={styles.infoValue}>
                      {getDaysRemaining(activeLoan)} days
                    </Text>
                  </View>
                </View>

                <View style={styles.infoItem}>
                  <Icon name="person" size={20} color="#1a237e" />
                  <View style={styles.infoText}>
                    <Text style={styles.infoLabel}>Lender</Text>
                    <Text style={styles.infoValue}>
                      {activeLoan.lenderId?.name}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoItem}>
                  <Icon name="phone" size={20} color="#1a237e" />
                  <View style={styles.infoText}>
                    <Text style={styles.infoLabel}>Lender Contact</Text>
                    <Text style={styles.infoValue}>
                      {activeLoan.lenderId?.phoneNumber}
                    </Text>
                  </View>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Quick Actions */}
          <View style={styles.actionsGrid}>
            <Button
              mode="contained"
              icon="payment"
              onPress={() => navigation.navigate('MakePayment')}
              style={styles.actionButton}
              contentStyle={styles.buttonContent}
            >
              Make Payment
            </Button>
            <Button
              mode="outlined"
              icon="history"
              onPress={() => navigation.navigate('PaymentHistory')}
              style={styles.actionButton}
              contentStyle={styles.buttonContent}
            >
              Payment History
            </Button>
            <Button
              mode="outlined"
              icon="qr-code"
              onPress={async () => {
                try {
                  const response = await loanService.getLenderQRCode();
                  navigation.navigate('LenderQRCode', { lenderInfo: response.data });
                } catch (error) {
                  console.error('Error loading lender QR code:', error);
                  // You could show an alert here
                }
              }}
              style={styles.actionButton}
              contentStyle={styles.buttonContent}
            >
              Lender QR Code
            </Button>
            <Button
              mode="outlined"
              icon="info"
              onPress={() => navigation.navigate('LoanDetails')}
              style={styles.actionButton}
              contentStyle={styles.buttonContent}
            >
              Loan Details
            </Button>
          </View>

          {/* Overdue Warning */}
          {activeLoan.daysOverdue > 0 && (
            <Card style={[styles.alertCard, styles.overdueCard]}>
              <Card.Content style={styles.alertContent}>
                <Icon name="warning" size={24} color="#d32f2f" />
                <View style={styles.alertText}>
                  <Text style={styles.alertTitle}>Payment Overdue</Text>
                  <Text style={styles.alertMessage}>
                    Your payment is {activeLoan.daysOverdue} day(s) overdue. Please make the payment immediately.
                  </Text>
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Due Today Warning */}
          {moment(activeLoan.nextDueDate).isSame(moment(), 'day') && (
            <Card style={[styles.alertCard, styles.dueTodayCard]}>
              <Card.Content style={styles.alertContent}>
                <Icon name="notification-important" size={24} color="#ff6f00" />
                <View style={styles.alertText}>
                  <Text style={styles.alertTitle}>Payment Due Today</Text>
                  <Text style={styles.alertMessage}>
                    Your payment is due today. Please make the payment to avoid late fees.
                  </Text>
                </View>
              </Card.Content>
            </Card>
          )}
        </>
      ) : (
        /* No Active Loan State */
        <Card style={styles.noLoanCard}>
          <Card.Content style={styles.noLoanContent}>
            <Icon name="account-balance-wallet" size={64} color="#ccc" />
            <Title style={styles.noLoanTitle}>No Active Loan</Title>
            <Paragraph style={styles.noLoanText}>
              You don't have any active loans at the moment.
            </Paragraph>
            <Paragraph style={styles.noLoanSubtext}>
              Please contact the admin to apply for a new loan.
            </Paragraph>
          </Card.Content>
        </Card>
      )}
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
  loanCard: {
    marginBottom: 16,
    elevation: 2,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  loanTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  statusChip: {
    height: 24,
  },
  loanDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  remainingBalance: {
    color: '#d32f2f',
  },
  totalPaid: {
    color: '#388e3c',
  },
  progressSection: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#388e3c',
    borderRadius: 3,
  },
  infoCard: {
    marginBottom: 16,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoText: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    width: '48%',
    marginBottom: 12,
  },
  buttonContent: {
    height: 44,
  },
  alertCard: {
    marginBottom: 16,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertText: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: 12,
    color: '#666',
  },
  overdueCard: {
    backgroundColor: '#ffebee',
    borderColor: '#d32f2f',
  },
  dueTodayCard: {
    backgroundColor: '#fff3e0',
    borderColor: '#ff6f00',
  },
  noLoanCard: {
    marginTop: 40,
    elevation: 2,
  },
  noLoanContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noLoanTitle: {
    marginTop: 16,
    marginBottom: 8,
    color: '#666',
  },
  noLoanText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 4,
  },
  noLoanSubtext: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
  },
});

export default BorrowerDashboard;