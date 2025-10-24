import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Text, Chip, ActivityIndicator, Searchbar } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import moment from 'moment';

import { loanService } from '../../services/loanService';

const PaymentHistoryScreen = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadPaymentHistoryCallback = useCallback(async () => {
    try {
      console.log('PaymentHistoryScreen: Starting to load payment history...');
      const response = await loanService.getPaymentHistory();
      console.log('PaymentHistoryScreen: API response received:', response);
      console.log('PaymentHistoryScreen: Response data:', response.data);
      console.log('PaymentHistoryScreen: Payments array:', response.data?.data);

      const paymentsData = response.data || [];
      console.log('PaymentHistoryScreen: Setting payments to:', paymentsData);

      setPayments(paymentsData);
      setFilteredPayments(paymentsData);
    } catch (error) {
      console.error('PaymentHistoryScreen: Error loading payment history:', error);
      console.error('PaymentHistoryScreen: Error details:', error.response?.data || error.message);
      setPayments([]);
      setFilteredPayments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log('PaymentHistoryScreen: Screen focused, loading payment history...');
      loadPaymentHistoryCallback();
    }, [loadPaymentHistoryCallback])
  );

  useEffect(() => {
    filterPayments();
  }, [searchQuery, payments]);



  const filterPayments = () => {
    if (!searchQuery) {
      setFilteredPayments(payments || []);
      return;
    }

    const filtered = (payments || []).filter(payment =>
      payment.amount.toString().includes(searchQuery) ||
      payment.utrNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredPayments(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPaymentHistoryCallback();
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

  const renderPaymentCard = ({ item }) => {
    try {
      const amount = item.amount || 0;
      const forDays = item.forDays || 1;
      const status = item.status || 'pending';
      const paymentDate = item.paymentDate ? moment(item.paymentDate).format('DD MMM YYYY') : 'N/A';
      const adminApprovalDate = item.adminApprovalDate ? moment(item.adminApprovalDate).format('DD MMM YYYY') : null;

      return (
        <Card style={styles.paymentCard}>
          <Card.Content>
            <View style={styles.paymentHeader}>
              <View style={styles.paymentInfo}>
                <Title style={styles.amount}>₹{amount.toLocaleString()}</Title>
                <Paragraph style={styles.days}>
                  For {forDays} day{forDays > 1 ? 's' : ''}
                </Paragraph>
              </View>
              <Chip
                mode="flat"
                textStyle={{ color: '#fff', fontSize: 12 }}
                style={[styles.statusChip, { backgroundColor: getStatusColor(status) }]}
                icon={getStatusIcon(status)}
              >
                {status.toUpperCase()}
              </Chip>
            </View>

            <View style={styles.paymentDetails}>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Icon name="calendar-today" size={14} color="#666" />
                  <Text style={styles.detailText}>
                    {paymentDate}
                  </Text>
                </View>
                {item.utrNumber && (
                  <View style={styles.detailItem}>
                    <Icon name="receipt" size={14} color="#666" />
                    <Text style={styles.detailText}>UTR: {item.utrNumber}</Text>
                  </View>
                )}
              </View>

              {adminApprovalDate && (
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Icon name="verified" size={14} color="#666" />
                    <Text style={styles.detailText}>
                      Approved: {adminApprovalDate}
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

            {item.screenshotUrl && (
              <View style={styles.screenshotNote}>
                <Icon name="image" size={14} color="#666" />
                <Text style={styles.screenshotText}>Screenshot uploaded</Text>
              </View>
            )}
          </Card.Content>
        </Card>
      );
    } catch (error) {
      console.error('Error rendering payment card:', error, item);
      return (
        <Card style={styles.paymentCard}>
          <Card.Content>
            <Text style={styles.errorText}>Error displaying payment</Text>
          </Card.Content>
        </Card>
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>Loading payment history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search by amount, UTR, or status..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          {filteredPayments?.length || 0} payment{(filteredPayments?.length || 0) !== 1 ? 's' : ''} found
        </Text>
        <View style={styles.statsChips}>
          <Chip mode="outlined" style={styles.statChip}>
            Pending: {payments?.filter(p => p.status === 'pending').length || 0}
          </Chip>
          <Chip mode="outlined" style={styles.statChip}>
            Approved: {payments?.filter(p => p.status === 'approved').length || 0}
          </Chip>
        </View>
      </View>

      <FlatList
        data={filteredPayments}
        renderItem={renderPaymentCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="payment" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No payments found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery 
                ? 'Try changing your search query' 
                : 'Your payment history will appear here'
              }
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
    marginBottom: 16,
  },
  searchBar: {
    elevation: 2,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsText: {
    color: '#666',
    fontSize: 14,
  },
  statsChips: {
    flexDirection: 'row',
  },
  statChip: {
    marginLeft: 8,
    height: 32,
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
    marginBottom: 2,
  },
  days: {
    color: '#666',
    fontSize: 12,
  },
  statusChip: {
    height: 28,
  },
  paymentDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  screenshotNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  screenshotText: {
    marginLeft: 6,
    color: '#666',
    fontSize: 12,
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
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
  },
});

export default PaymentHistoryScreen;
