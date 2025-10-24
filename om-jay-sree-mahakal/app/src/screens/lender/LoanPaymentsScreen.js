import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Title, Paragraph, Text, Chip, ActivityIndicator } from 'react-native-paper';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import moment from 'moment';

import { loanService } from '../../services/loanService';

const LoanPaymentsScreen = ({ route }) => {
  const { loanId } = route.params;
  const [payments, setPayments] = useState([]);
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLoanPayments();
  }, [loanId]);

  const loadLoanPayments = async () => {
    try {
      const response = await loanService.getLoanPayments(loanId);
      setPayments(response.data);
      // You might want to fetch loan details separately if needed
    } catch (error) {
      console.error('Error loading loan payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#388e3c';
      case 'pending': return '#ff6f00';
      case 'rejected': return '#d32f2f';
      default: return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return 'check-circle';
      case 'pending': return 'schedule';
      case 'rejected': return 'cancel';
      default: return 'help';
    }
  };

  const renderPaymentCard = ({ item }) => (
    <Card style={styles.paymentCard}>
      <Card.Content>
        <View style={styles.paymentHeader}>
          <View style={styles.paymentInfo}>
            <Title style={styles.amount}>₹{item.amount?.toLocaleString()}</Title>
            <Paragraph style={styles.days}>
              For {item.forDays} day{item.forDays > 1 ? 's' : ''}
            </Paragraph>
          </View>
          <Chip 
            mode="flat"
            textStyle={{ color: '#fff', fontSize: 12 }}
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
            icon={getStatusIcon(item.status)}
          >
            {item.status.toUpperCase()}
          </Chip>
        </View>

        <View style={styles.paymentDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Icon name="calendar-today" size={14} color="#666" />
              <Text style={styles.detailText}>
                {moment(item.paymentDate).format('DD MMM YYYY')}
              </Text>
            </View>
            {item.utrNumber && (
              <View style={styles.detailItem}>
                <Icon name="receipt" size={14} color="#666" />
                <Text style={styles.detailText}>UTR: {item.utrNumber}</Text>
              </View>
            )}
          </View>

          {item.adminApprovalDate && (
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Icon name="verified" size={14} color="#666" />
                <Text style={styles.detailText}>
                  Approved: {moment(item.adminApprovalDate).format('DD MMM YYYY')}
                </Text>
              </View>
            </View>
          )}

          {item.rejectionReason && (
            <View style={styles.rejectionSection}>
              <Text style={styles.rejectionLabel}>Rejection Reason:</Text>
              <Text style={styles.rejectionReason}>{item.rejectionReason}</Text>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>Loading payments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Loan Payments</Text>
        <Text style={styles.subtitle}>
          {payments.length} payment{payments.length !== 1 ? 's' : ''} recorded
        </Text>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total Received</Text>
          <Text style={styles.statValue}>
            ₹{payments.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Pending</Text>
          <Text style={styles.statValue}>
            {payments.filter(p => p.status === 'pending').length}
          </Text>
        </View>
      </View>

      <FlatList
        data={payments}
        renderItem={renderPaymentCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="payments" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No payments found</Text>
            <Text style={styles.emptySubtext}>
              Payment history will appear here once payments are made
            </Text>
          </View>
        }
      />
    </View>
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
    marginBottom: 20,
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
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  listContent: {
    paddingBottom: 16,
  },
  paymentCard: {
    marginBottom: 12,
    elevation: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 4,
  },
  days: {
    color: '#666',
    fontSize: 12,
  },
  statusChip: {
    height: 24,
  },
  paymentDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    marginLeft: 6,
    color: '#666',
    fontSize: 12,
  },
  rejectionSection: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#ffebee',
    borderRadius: 4,
  },
  rejectionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 2,
  },
  rejectionReason: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default LoanPaymentsScreen;