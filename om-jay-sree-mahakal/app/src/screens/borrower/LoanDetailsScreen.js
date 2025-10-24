import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Text, Chip, Divider, ActivityIndicator } from 'react-native-paper';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import moment from 'moment';

import { loanService } from '../../services/loanService';

const LoanDetailsScreen = () => {
  const [loanDetails, setLoanDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    loadLoanDetails();
  }, []);

  const loadLoanDetails = async () => {
    try {
      const response = await loanService.getBorrowerLoans();
      setLoanDetails(response.data);
    } catch (error) {
      console.error('Error loading loan details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#388e3c';
      case 'closed': return '#666';
      case 'defaulted': return '#d32f2f';
      default: return '#ff6f00';
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>Loading loan details...</Text>
      </View>
    );
  }

  const loan = loanDetails?.activeLoan;

  if (!loan) {
    return (
      <View style={styles.center}>
        <Icon name="account-balance-wallet" size={64} color="#ccc" />
        <Text style={styles.errorText}>No active loan found</Text>
        <Text style={styles.errorSubtext}>
          You don't have any active loans at the moment
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Loan Details</Text>
        <Text style={styles.subtitle}>Complete information about your loan</Text>
      </View>

      {/* Loan Overview Card */}
      <Card style={styles.overviewCard}>
        <Card.Content>
          <View style={styles.loanHeader}>
            <View>
              <Title style={styles.loanId}>{loan.loanId}</Title>
              <Chip 
                mode="flat"
                textStyle={{ color: '#fff' }}
                style={[styles.statusChip, { backgroundColor: getStatusColor(loan.status) }]}
              >
                {loan.status.toUpperCase()}
              </Chip>
            </View>
            <Text style={styles.loanAmount}>
              ₹{loan.principalAmount?.toLocaleString()}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Loan Terms */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Loan Terms</Title>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Icon name="account-balance" size={20} color="#1a237e" />
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>Principal Amount</Text>
                <Text style={styles.detailValue}>
                  ₹{loan.principalAmount?.toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Icon name="calendar-today" size={20} color="#1a237e" />
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>Loan Period</Text>
                <Text style={styles.detailValue}>
                  {loan.totalDays} days
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Icon name="payments" size={20} color="#1a237e" />
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>Daily EMI</Text>
                <Text style={styles.detailValue}>
                  ₹{loan.emiPerDay?.toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Icon name="date-range" size={20} color="#1a237e" />
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>Start Date</Text>
                <Text style={styles.detailValue}>
                  {moment(loan.startDate).format('DD MMM YYYY')}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Icon name="event-available" size={20} color="#1a237e" />
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>End Date</Text>
                <Text style={styles.detailValue}>
                  {moment(loan.endDate).format('DD MMM YYYY')}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Icon name="schedule" size={20} color="#1a237e" />
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>Next Due Date</Text>
                <Text style={styles.detailValue}>
                  {moment(loan.nextDueDate).format('DD MMM YYYY')}
                </Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Payment Summary */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Payment Summary</Title>
          <View style={styles.paymentSummary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Amount Paid</Text>
              <Text style={[styles.summaryValue, styles.paidAmount]}>
                ₹{loanDetails?.paymentSummary?.totalPaid?.toLocaleString() || 0}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Remaining Balance</Text>
              <Text style={[styles.summaryValue, styles.remainingAmount]}>
                ₹{loan.remainingBalance?.toLocaleString()}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Days Overdue</Text>
              <Text style={[styles.summaryValue, loan.daysOverdue > 0 ? styles.overdue : styles.normal]}>
                {loan.daysOverdue || 0} days
              </Text>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Progress</Text>
              <Text style={styles.summaryValue}>
                {Math.round(((loan.principalAmount - loan.remainingBalance) / loan.principalAmount) * 100)}%
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${((loan.principalAmount - loan.remainingBalance) / loan.principalAmount) * 100}%` 
                  }
                ]} 
              />
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Lender Information */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Lender Information</Title>
          <View style={styles.lenderInfo}>
            <View style={styles.lenderDetail}>
              <Icon name="person" size={16} color="#666" />
              <Text style={styles.lenderText}>{loan.lenderId?.name}</Text>
            </View>
            <View style={styles.lenderDetail}>
              <Icon name="phone" size={16} color="#666" />
              <Text style={styles.lenderText}>{loan.lenderId?.phoneNumber}</Text>
            </View>
            <View style={styles.lenderDetail}>
              <Icon name="payment" size={16} color="#666" />
              <Text style={styles.lenderText}>{loan.lenderId?.upiId}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Admin Information */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Admin Information</Title>
          <View style={styles.adminInfo}>
            <View style={styles.adminDetail}>
              <Icon name="admin-panel-settings" size={16} color="#666" />
              <Text style={styles.adminText}>
                Created by: {loan.adminId?.username}
              </Text>
            </View>
            <View style={styles.adminDetail}>
              <Icon name="update" size={16} color="#666" />
              <Text style={styles.adminText}>
                Last updated: {moment(loan.updatedAt).format('DD MMM YYYY')}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
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
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
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
  overviewCard: {
    marginBottom: 16,
    elevation: 2,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loanId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 8,
  },
  statusChip: {
    height: 28,
  },
  loanAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  sectionCard: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailText: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
  },
  paymentSummary: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  paidAmount: {
    color: '#388e3c',
  },
  remainingAmount: {
    color: '#d32f2f',
  },
  overdue: {
    color: '#d32f2f',
  },
  normal: {
    color: '#388e3c',
  },
  divider: {
    marginVertical: 8,
  },
  progressContainer: {
    marginTop: 8,
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
  lenderInfo: {
    marginTop: 8,
  },
  lenderDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  lenderText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  adminInfo: {
    marginTop: 8,
  },
  adminDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  adminText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
});

export default LoanDetailsScreen;