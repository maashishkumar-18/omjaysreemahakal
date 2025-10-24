import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Button } from 'react-native';
import { Searchbar, Card, Title, Paragraph, Text, Chip, ActivityIndicator, Menu } from 'react-native-paper';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { loanService } from '../../services/loanService';

const LenderLoansScreen = ({ navigation }) => {
  const [loans, setLoans] = useState([]);
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    loadLoans();
  }, []);

  useEffect(() => {
    filterLoans();
  }, [searchQuery, selectedStatus, loans]);

  const loadLoans = async () => {
    try {
      const response = await loanService.getLenderLoans();
      setLoans(response.data);
      setFilteredLoans(response.data);
    } catch (error) {
      console.error('Error loading loans:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLoans = () => {
    let filtered = loans;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(loan => loan.status === selectedStatus);
    }

    if (searchQuery) {
      filtered = filtered.filter(loan =>
        loan.borrowerId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.loanId?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredLoans(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#388e3c';
      case 'closed': return '#666';
      case 'defaulted': return '#d32f2f';
      default: return '#ff6f00';
    }
  };

  const renderLoanCard = ({ item }) => (
    <Card 
      style={styles.loanCard}
      onPress={() => navigation.navigate('LoanPayments', { loanId: item._id })}
    >
      <Card.Content>
        <View style={styles.loanHeader}>
          <View style={styles.loanInfo}>
            <Title style={styles.borrowerName}>{item.borrowerId?.name}</Title>
            <Paragraph style={styles.loanId}>{item.loanId}</Paragraph>
          </View>
          <Chip 
            mode="flat"
            textStyle={{ color: '#fff', fontSize: 12 }}
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
          >
            {item.status.toUpperCase()}
          </Chip>
        </View>

        <View style={styles.loanDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Loan Amount</Text>
              <Text style={styles.detailValue}>
                ₹{item.principalAmount?.toLocaleString()}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Daily EMI</Text>
              <Text style={styles.detailValue}>
                ₹{item.emiPerDay?.toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Remaining Balance</Text>
              <Text style={[styles.detailValue, styles.balance]}>
                ₹{item.remainingBalance?.toLocaleString()}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Borrower Phone</Text>
              <Text style={styles.detailValue}>
                {item.borrowerId?.phoneNumber}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardActions}>
          <Button
            mode="outlined"
            compact
            onPress={() => navigation.navigate('LoanPayments', { loanId: item._id })}
            style={styles.actionButton}
          >
            View Payments
          </Button>
          <Button
            mode="outlined"
            compact
            onPress={() => {
              // View borrower details or contact
            }}
            style={styles.actionButton}
          >
            Contact
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>Loading your loans...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search by borrower name or loan ID..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Button 
              mode="outlined" 
              onPress={() => setMenuVisible(true)}
              style={styles.filterButton}
              icon="filter-list"
            >
              {selectedStatus === 'all' ? 'All Status' : selectedStatus}
            </Button>
          }
        >
          <Menu.Item onPress={() => { setSelectedStatus('all'); setMenuVisible(false); }} title="All Status" />
          <Menu.Item onPress={() => { setSelectedStatus('active'); setMenuVisible(false); }} title="Active" />
          <Menu.Item onPress={() => { setSelectedStatus('closed'); setMenuVisible(false); }} title="Closed" />
        </Menu>
      </View>

      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          {filteredLoans.length} loan{filteredLoans.length !== 1 ? 's' : ''} found
        </Text>
        <View style={styles.statsChips}>
          <Chip mode="outlined" style={styles.statChip}>
            Active: {loans.filter(l => l.status === 'active').length}
          </Chip>
          <Chip mode="outlined" style={styles.statChip}>
            Total: {loans.length}
          </Chip>
        </View>
      </View>

      <FlatList
        data={filteredLoans}
        renderItem={renderLoanCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="account-balance" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No loans found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || selectedStatus !== 'all' 
                ? 'Try changing your search or filters' 
                : 'You have not been assigned any loans yet'
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
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    marginRight: 8,
  },
  filterButton: {
    minWidth: 120,
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
  loanCard: {
    marginBottom: 12,
    elevation: 2,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  loanInfo: {
    flex: 1,
  },
  borrowerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 4,
  },
  loanId: {
    color: '#666',
    fontSize: 12,
  },
  statusChip: {
    height: 24,
  },
  loanDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
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
  balance: {
    color: '#d32f2f',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
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

export default LenderLoansScreen;