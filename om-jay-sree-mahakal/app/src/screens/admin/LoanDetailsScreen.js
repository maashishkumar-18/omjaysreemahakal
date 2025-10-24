import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Text, Button, Chip, ActivityIndicator, Divider, Menu } from 'react-native-paper';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import moment from 'moment';

import { loanService } from '../../services/loanService';

const LoanDetailsScreen = ({ route, navigation }) => {
  const { loanId } = route.params;
  const [loanDetails, setLoanDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);

  useEffect(() => {
    loadLoanDetails();
  }, [loanId]);

  const loadLoanDetails = async () => {
    try {
      const response = await loanService.getLoanDetails(loanId);
      setLoanDetails(response.data);
    } catch (error) {
      console.error('Error loading loan details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      const response = await loanService.updateLoanStatus(loanId, newStatus);
      if (response.success) {
        // Reload loan details
        await loadLoanDetails();
        setStatusMenuVisible(false);
        // You could add a success snackbar here if needed
      } else {
        console.error('Failed to update loan status:', response.message);
        // You could add an error snackbar here
      }
    } catch (error) {
      console.error('Error updating loan status:', error);
      // You could add an error snackbar here
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

  if (!loanDetails) {
    return (
      <View style={styles.center}>
        <Icon name="error-outline" size={64} color="#ccc" />
        <Text style={styles.errorText}>Loan not found</Text>
      </View>
    );
  }

  const { loan, paymentSummary, paymentHistory } = loanDetails;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Loan Details</Text>
        <Text style={styles.subtitle}>Complete loan information</Text>
      </View>

      {/* Loan Overview */}
      <Card style={styles.overviewCard}>
        <Card.Content>
          <View style={styles.loanHeader}>
            <View>
              <Title style={styles.loanId}>{loan.loanId}</Title>
              <View style={styles.statusSection}>
                <Chip 
                  mode="flat"
                  textStyle={{ color: '#fff' }}
                  style={[styles.statusChip, { backgroundColor: getStatusColor(loan.status) }]}
                >
                  {loan.status.toUpperCase()}
                </Chip>
                <Menu
                  visible={statusMenuVisible}
                  onDismiss={() => setStatusMenuVisible(false)}
                  anchor={
                    <Button 
                      mode="text" 
                      compact
                      onPress={() => setStatusMenuVisible(true)}
                      icon="edit"
                    >
                      Change
                    </Button>
                  }
                >
                  <Menu.Item 
                    onPress={() => handleStatusUpdate('active')} 
                    title="Mark as Active" 
                  />
                  <Menu.Item 
                    onPress={() => handleStatusUpdate('closed')} 
                    title="Mark as Closed" 
                  />
                  <Menu.Item 
                    onPress={() => handleStatusUpdate('defaulted')} 
                    title="Mark as Defaulted" 
                  />
                </Menu>
              </View>
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
                ₹{paymentSummary?.totalPaid?.toLocaleString() || 0}
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

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Payment Progress</Text>
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

      {/* Borrower Information */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Borrower Information</Title>
          <View style={styles.userInfo}>
            <View style={styles.userDetail}>
              <Icon name="person" size={16} color="#666" />
              <Text style={styles.userText}>{loan.borrowerId?.name}</Text>
            </View>
            <View style={styles.userDetail}>
              <Icon name="phone" size={16} color="#666" />
              <Text style={styles.userText}>{loan.borrowerId?.phoneNumber}</Text>
            </View>
            <View style={styles.userDetail}>
              <Icon name="home" size={16} color="#666" />
              <Text style={styles.userText}>{loan.borrowerId?.address}</Text>
            </View>
          </View>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('UserDetails', { userId: loan.borrowerUserId?._id || loan.borrowerId })}
            style={styles.userButton}
          >
            View Borrower Details
          </Button>
        </Card.Content>
      </Card>

      {/* Lender Information */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Lender Information</Title>
          <View style={styles.userInfo}>
            <View style={styles.userDetail}>
              <Icon name="person" size={16} color="#666" />
              <Text style={styles.userText}>{loan.lenderId?.name}</Text>
            </View>
            <View style={styles.userDetail}>
              <Icon name="phone" size={16} color="#666" />
              <Text style={styles.userText}>{loan.lenderId?.phoneNumber}</Text>
            </View>
            <View style={styles.userDetail}>
              <Icon name="payment" size={16} color="#666" />
              <Text style={styles.userText}>{loan.lenderId?.upiId}</Text>
            </View>
          </View>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('UserDetails', { userId: loan.lenderUserId?._id || loan.lenderId })}
            style={styles.userButton}
          >
            View Lender Details
          </Button>
        </Card.Content>
      </Card>

      {/* Recent Payments */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>
            Recent Payments ({paymentHistory?.length || 0})
          </Title>
          
          {paymentHistory && paymentHistory.length > 0 ? (
            paymentHistory.slice(0, 5).map((payment, index) => (
              <View key={payment._id} style={styles.paymentItem}>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentAmount}>
                    ₹{payment.amount?.toLocaleString()}
                  </Text>
                  <Text style={styles.paymentDays}>
                    For {payment.forDays} day{payment.forDays > 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={styles.paymentMeta}>
                  <Chip 
                    mode="flat"
                    textStyle={{ color: '#fff', fontSize: 10 }}
                    style={[
                      styles.paymentStatus,
                      { backgroundColor: getStatusColor(payment.status) }
                    ]}
                  >
                    {payment.status.toUpperCase()}
                  </Chip>
                  <Text style={styles.paymentDate}>
                    {moment(payment.paymentDate).format('DD MMM')}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyPayments}>
              <Icon name="payments" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No payments recorded</Text>
            </View>
          )}

          {paymentHistory && paymentHistory.length > 5 && (
            <Button
              mode="text"
              onPress={() => navigation.navigate('PaymentApproval')}
              style={styles.viewAllButton}
            >
              View All Payments
            </Button>
          )}
        </Card.Content>
      </Card>

      {/* Admin Actions */}
      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('PaymentApproval')}
          style={styles.actionButton}
          icon="payment"
        >
          Manage Payments
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    minHeight: '100vh', // Ensures web viewport height
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    minHeight: 600, // ensures scroll works even if content is small
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
  overviewCard: {
    marginBottom: 16,
    elevation: 2,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  loanId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 8,
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusChip: {
    height: 28,
    marginRight: 8,
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
  userInfo: {
    marginBottom: 16,
  },
  userDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  userButton: {
    marginTop: 8,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 2,
  },
  paymentDays: {
    fontSize: 12,
    color: '#666',
  },
  paymentMeta: {
    alignItems: 'flex-end',
  },
  paymentStatus: {
    marginBottom: 4,
    height: 20,
  },
  paymentDate: {
    fontSize: 10,
    color: '#666',
  },
  emptyPayments: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  viewAllButton: {
    marginTop: 8,
  },
  actions: {
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#1a237e',
  },
});

export default LoanDetailsScreen;