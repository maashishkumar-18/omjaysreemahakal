import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, useWindowDimensions, Alert } from 'react-native';
import { Searchbar, Card, Title, Paragraph, Text, Button, Chip, ActivityIndicator, Menu, Snackbar, Dialog, Portal } from 'react-native-paper';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { loanService } from '../../services/loanService';
import { adminService } from '../../services/adminService'; // Use adminService instead of userService

const LoanManagementScreen = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 360;
  const isTablet = width >= 768;

  const [loans, setLoans] = useState([]);
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [menuVisible, setMenuVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [loanToDelete, setLoanToDelete] = useState(null);

  const user = useSelector(state => state.auth.user);

  useEffect(() => {
    loadLoans();
  }, []);

  useEffect(() => {
    filterLoans();
  }, [searchQuery, selectedStatus, loans]);

  const loadLoans = async () => {
    try {
      setLoading(true);
      let response;

      if (user?.role === 'admin') {
        response = await loanService.getLoans();
      } else if (user?.role === 'lender') {
        response = await loanService.getLenderLoans();
      } else if (user?.role === 'borrower') {
        response = await loanService.getBorrowerLoans();
      } else {
        throw new Error('Invalid user role');
      }

      if (!response || !response.data) {
        setLoans([]);
        return;
      }

      const loanData = Array.isArray(response.data) ? response.data : [];
      setLoans(loanData);
    } catch (error) {
      console.error('Error loading loans:', error);
      showSnackbar(error.message || 'Failed to load loans');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLoans();
  };

  const filterLoans = () => {
    if (!Array.isArray(loans)) {
      setFilteredLoans([]);
      return;
    }

    let filtered = loans;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(loan => loan.status === selectedStatus);
    }

    if (searchQuery) {
      filtered = filtered.filter(loan =>
        loan.loanId && loan.loanId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.borrowerId?.name && loan.borrowerId.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.lenderId?.name && loan.lenderId.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.borrowerId?.phoneNumber && loan.borrowerId.phoneNumber.includes(searchQuery)
      );
    }

    setFilteredLoans(filtered);
  };

  const handleViewUser = async (profileName, role) => {
    try {
      // First, get all users to find the one with matching profile
      const usersResponse = await adminService.getUsers({ role: role });
      const allUsers = usersResponse.data || [];

      // Find the user that has a profile with matching name and role
      const foundUser = allUsers.find(user =>
        user.profile &&
        user.role === role &&
        user.profile.name === profileName
      );

      if (foundUser) {
        // Now get the complete user details using the user ID
        const userDetailsResponse = await adminService.getUserDetails(foundUser._id);

        if (userDetailsResponse.success) {
          navigation.navigate('UserDetails', {
            userId: foundUser._id // Pass the USER ID, not profile ID
          });
        } else {
          showSnackbar('Failed to load user details');
        }
      } else {
        showSnackbar('User not found in system');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      showSnackbar('Error loading user details');
    }
  };

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const confirmDelete = async () => {
    if (!loanToDelete) return;

    try {
      await loanService.deleteLoan(loanToDelete._id);
      showSnackbar('Loan deleted successfully');
      loadLoans();
    } catch (error) {
      console.error('Error deleting loan:', error);
      showSnackbar(error.message || 'Failed to delete loan');
    } finally {
      setDeleteDialogVisible(false);
      setLoanToDelete(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#388e3c';
      case 'closed': return '#666';
      case 'defaulted': return '#d32f2f';
      case 'pending': return '#ff6f00';
      default: return '#757575';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const renderLoanCard = ({ item }) => {
    const isAdmin = user?.role === 'admin';
    const isLender = user?.role === 'lender';
    const isBorrower = user?.role === 'borrower';

  const handleDelete = (loan) => {
    setLoanToDelete(loan);
    setDeleteDialogVisible(true);
  };

    return (
      <Card
        style={styles.loanCard}
        onPress={() => navigation.navigate('LoanDetails', {
          loanId: item._id,
          loanData: item
        })}
      >
        <Card.Content>
          <View style={styles.loanHeader}>
            <View style={styles.leftSection}>
              <Chip
                mode="flat"
                style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
              >
                {item.status?.toUpperCase() || 'UNKNOWN'}
              </Chip>
              <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteIcon}>
                <Icon name="delete" size={24} color="#d32f2f" />
              </TouchableOpacity>
            </View>
            <View style={styles.loanInfo}>
              <Title style={styles.loanId}>{item.loanId || 'N/A'}</Title>
              <Paragraph style={styles.loanBorrower}>
                {isLender ? 'Borrower: ' : isBorrower ? 'Lender: ' : ''}
                {isLender ? item.borrowerId?.name :
                 isBorrower ? item.lenderId?.name :
                 `Borrower: ${item.borrowerId?.name}`}
              </Paragraph>
            </View>
          </View>

          <View style={styles.loanDetails}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Amount</Text>
                <Text style={styles.detailValue}>
                  {formatCurrency(item.principalAmount)}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>EMI/Day</Text>
                <Text style={styles.detailValue}>
                  {formatCurrency(item.emiPerDay)}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Balance</Text>
                <Text style={[styles.detailValue, 
                  item.remainingBalance > 0 ? styles.balanceDue : styles.balancePaid
                ]}>
                  {formatCurrency(item.remainingBalance)}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Due Date</Text>
                <Text style={styles.detailValue}>
                  {formatDate(item.nextDueDate)}
                </Text>
              </View>
            </View>

            {isAdmin && (
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Lender</Text>
                  <Text style={styles.detailValue}>{item.lenderId?.name}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Start Date</Text>
                  <Text style={styles.detailValue}>{formatDate(item.startDate)}</Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.cardActions}>
            <Button
              mode="outlined"
              compact
              onPress={() => navigation.navigate('LoanDetails', {
                loanId: item._id,
                loanData: item
              })}
              style={styles.actionButton}
              contentStyle={styles.buttonLabel}
            >
              Details
            </Button>

            {isAdmin && (
              <Button
                mode="outlined"
                compact
                onPress={() => navigation.navigate('UserDetails', { userId: item.borrowerUserId?._id || item.borrowerId })}
                style={styles.actionButton}
                contentStyle={styles.buttonLabel}
              >
                Borrower
              </Button>
            )}

            {isAdmin && (
              <Button
                mode="outlined"
                compact
                onPress={() => navigation.navigate('UserDetails', { userId: item.lenderUserId?._id || item.lenderId })}
                style={styles.actionButton}
                contentStyle={styles.buttonLabel}
              >
                Lender
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>Loading Loans...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isSmallScreen && styles.containerSmall]}>
      <View style={[styles.header, isSmallScreen && styles.headerSmall]}>
        <Searchbar
          placeholder={
            user?.role === 'admin'
              ? "Search by loan ID, borrower, or lender..."
              : user?.role === 'lender'
              ? "Search by loan ID or borrower..."
              : "Search by loan ID..."
          }
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchBar, isSmallScreen && styles.searchBarSmall]}
        />

        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setMenuVisible(true)}
              style={[styles.filterButton, isSmallScreen && styles.filterButtonSmall]}
              icon="filter-list"
            >
              {selectedStatus === 'all' ? 'All Status' : selectedStatus}
            </Button>
          }
        >
          <Menu.Item onPress={() => { setSelectedStatus('all'); setMenuVisible(false); }} title="All Status" />
          <Menu.Item onPress={() => { setSelectedStatus('active'); setMenuVisible(false); }} title="Active" />
          <Menu.Item onPress={() => { setSelectedStatus('closed'); setMenuVisible(false); }} title="Closed" />
          <Menu.Item onPress={() => { setSelectedStatus('defaulted'); setMenuVisible(false); }} title="Defaulted" />
        </Menu>
      </View>

      <View style={[styles.statsBar, isSmallScreen && styles.statsBarSmall]}>
        <Text style={[styles.statsText, isSmallScreen && styles.statsTextSmall]}>
          Showing {filteredLoans.length} of {loans.length} loans
        </Text>

        {user?.role === 'admin' && (
          <Button
            mode="contained"
            icon="plus"
            onPress={() => navigation.navigate('CreateLoan')}
            compact
            style={isSmallScreen && styles.createButtonSmall}
          >
            Create Loan
          </Button>
        )}
      </View>

      <FlatList
        data={filteredLoans}
        renderItem={renderLoanCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1a237e']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="account-balance" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No loans found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || selectedStatus !== 'all' 
                ? 'Try changing your search or filters' 
                : user?.role === 'admin'
                ? 'Get started by creating your first loan'
                : 'No loans assigned to you yet'
              }
            </Text>
            {user?.role === 'admin' && !searchQuery && selectedStatus === 'all' && (
              <Button
                mode="contained"
                onPress={() => navigation.navigate('CreateLoan')}
                style={styles.emptyButton}
              >
                Create First Loan
              </Button>
            )}
          </View>
        }
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>

      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>Delete Loan</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              Are you sure you want to delete this loan? This action cannot be undone.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button onPress={confirmDelete} textColor="#d32f2f">Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  containerSmall: {
    padding: 8,
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
  headerSmall: {
    flexDirection: 'column',
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    marginRight: 8,
  },
  searchBarSmall: {
    marginRight: 0,
    marginBottom: 8,
    height: 40,
  },
  filterButton: {
    minWidth: 120,
  },
  filterButtonSmall: {
    minWidth: 100,
    alignSelf: 'flex-start',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsBarSmall: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statsText: {
    color: '#666',
    fontSize: 14,
  },
  statsTextSmall: {
    fontSize: 12,
    marginBottom: 8,
  },
  createButtonSmall: {
    alignSelf: 'flex-end',
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
  leftSection: {
    alignItems: 'flex-start',
  },
  deleteIcon: {
    marginTop: 8,
  },
  loanInfo: {
    flex: 1,
  },
  loanId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 4,
  },
  loanBorrower: {
    color: '#666',
    fontSize: 12,
  },
  statusChip: {
    height: 32,
    minWidth: 70,
    paddingHorizontal: 12,
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
  balanceDue: {
    color: '#d32f2f',
    fontWeight: 'bold',
  },
  balancePaid: {
    color: '#388e3c',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    minWidth: 80,
  },
  buttonLabel: {
    fontSize: 12,
    textAlign: 'center',
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
    marginBottom: 16,
  },
  emptyButton: {
    marginTop: 8,
  },
});

export default LoanManagementScreen;