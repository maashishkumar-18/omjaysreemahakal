import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList, useWindowDimensions, Alert } from 'react-native';
import { Searchbar, Card, Title, Paragraph, Text, Button, Chip, ActivityIndicator, Menu, Divider, Snackbar, Portal, Dialog } from 'react-native-paper';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { adminService } from '../../services/adminService';

const UserManagementScreen = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 360;
  const isTablet = width >= 768;
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [menuVisible, setMenuVisible] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  const [deleteDialog, setDeleteDialog] = useState({ visible: false, user: null });

  const loadUsers = async () => {
    try {
      const response = await adminService.getUsers();
      if (!response || !response.data) {
        setUsers([]);
        setFilteredUsers([]);
        return;
      }
      const userData = Array.isArray(response.data) ? response.data : [];
      setUsers(userData);
      setFilteredUsers(userData);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, selectedRole, users]);

  const filterUsers = () => {
    if (!Array.isArray(users)) {
      setFilteredUsers([]);
      return;
    }

    let filtered = users;

    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.profile?.name && user.profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.profile?.phoneNumber && user.profile.phoneNumber.includes(searchQuery)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleUserStatusUpdate = async (userId, isActive) => {
    try {
      await adminService.updateUserStatus(userId, isActive);
      await loadUsers(); // Reload users
    } catch (error) {
      const message = error.response?.status === 404
        ? 'User not found'
        : (error.response?.data?.message || 'Failed to update user status');
      setSnackbar({ visible: true, message });
    }
  };

  const handleDeleteUser = async (user) => {
    console.log('handleDeleteUser called with user:', user);
    try {
      console.log('Calling adminService.deleteUser with userId:', user._id);
      const response = await adminService.deleteUser(user._id);
      console.log('Delete response:', response);
      setDeleteDialog({ visible: false, user: null });
      await loadUsers(); // Reload users
      setSnackbar({ visible: true, message: 'User deleted successfully' });
    } catch (error) {
      console.log('Delete error:', error);
      console.log('Error response:', error.response);
      const message = error.response?.status === 400
        ? error.response.data.message
        : (error.response?.data?.message || 'Failed to delete user');
      setSnackbar({ visible: true, message });
    }
  };

  const showDeleteDialog = (user) => {
    console.log('showDeleteDialog called with user:', user);
    setDeleteDialog({ visible: true, user });
  };

  const hideDeleteDialog = () => {
    console.log('hideDeleteDialog called');
    setDeleteDialog({ visible: false, user: null });
  };

  const renderUserCard = ({ item }) => (
    <Card style={styles.userCard}>
      <Card.Content>
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <Title style={styles.userName}>{item.profile?.name || 'No Name'}</Title>
            <Paragraph style={styles.userUsername}>@{item.username}</Paragraph>
          </View>
          <View style={styles.userMeta}>
            <Chip
              mode="outlined"
              style={[
                styles.roleChip,
                item.role === 'lender' && styles.lenderChip,
                item.role === 'borrower' && styles.borrowerChip,
              ]}
              textStyle={styles.roleChipText}
            >
              {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
            </Chip>
            <Chip
              mode="flat"
              style={[
                styles.statusChip,
                item.isActive ? styles.activeChip : styles.inactiveChip
              ]}
              textStyle={styles.chipText}
            >
              {item.isActive ? 'Active' : 'Inactive'}
            </Chip>
          </View>
        </View>

        <View style={styles.userDetails}>
          <View style={styles.detailItem}>
            <Icon name="phone" size={16} color="#666" />
            <Text style={styles.detailText}>{item.profile?.phoneNumber || 'N/A'}</Text>
          </View>
          {item.role === 'borrower' && (
            <View style={styles.detailItem}>
              <Icon name="location-on" size={16} color="#666" />
              <Text style={styles.detailText} numberOfLines={1}>
                {item.profile?.address || 'No address'}
              </Text>
            </View>
          )}
          {item.role === 'lender' && (
            <View style={styles.detailItem}>
              <Icon name="qr-code" size={16} color="#666" />
              <Text style={styles.detailText}>UPI: {item.profile?.upiId || 'N/A'}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardActions}>
          <Button
            mode="outlined"
            compact
            onPress={() => navigation.navigate('UserDetails', { userId: item._id })}
            style={styles.actionButton}
          >
            View
          </Button>
          <Button
            mode={item.isActive ? "outlined" : "contained"}
            compact
            onPress={() => handleUserStatusUpdate(item._id, !item.isActive)}
            style={styles.actionButton}
            textColor={item.isActive ? '#d32f2f' : '#388e3c'}
          >
            {item.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            mode="outlined"
            compact
            onPress={() => showDeleteDialog(item)}
            style={[styles.actionButton, styles.deleteButton]}
            textColor="#d32f2f"
          >
            Delete
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>Loading Users...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isSmallScreen && styles.containerSmall]}>
      <View style={[styles.header, isSmallScreen && styles.headerSmall]}>
        <Searchbar
          placeholder="Search users by name, username, or phone..."
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
              {selectedRole === 'all' ? 'All Roles' : selectedRole}
            </Button>
          }
        >
          <Menu.Item onPress={() => { setSelectedRole('all'); setMenuVisible(false); }} title="All Roles" />
          <Menu.Item onPress={() => { setSelectedRole('lender'); setMenuVisible(false); }} title="Lenders" />
          <Menu.Item onPress={() => { setSelectedRole('borrower'); setMenuVisible(false); }} title="Borrowers" />
        </Menu>
      </View>

      <View style={[styles.statsBar, isSmallScreen && styles.statsBarSmall]}>
        <Text style={[styles.statsText, isSmallScreen && styles.statsTextSmall]}>
          Showing {filteredUsers.length} of {users.length} users
        </Text>
        <Button
          mode="contained"
          icon="person-add"
          onPress={() => navigation.navigate('CreateUser')}
          compact
          style={isSmallScreen && styles.addButtonSmall}
        >
          Add User
        </Button>
      </View>

      <FlatList
        data={filteredUsers}
        renderItem={renderUserCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No users found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || selectedRole !== 'all'
                ? 'Try changing your search or filters'
                : 'Get started by adding your first user'
              }
            </Text>
          </View>
        }
      />

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={4000}
        action={{
          label: 'OK',
          onPress: () => setSnackbar({ ...snackbar, visible: false })
        }}
      >
        {snackbar.message}
      </Snackbar>

      <Portal>
        <Dialog visible={deleteDialog.visible} onDismiss={hideDeleteDialog}>
          <Dialog.Title>Delete User</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              Are you sure you want to delete user "{deleteDialog.user?.profile?.name || deleteDialog.user?.username}"?
              This action cannot be undone.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDeleteDialog}>Cancel</Button>
            <Button onPress={() => handleDeleteUser(deleteDialog.user)}>Delete</Button>
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
  addButtonSmall: {
    alignSelf: 'flex-end',
  },
  listContent: {
    paddingBottom: 16,
  },
  userCard: {
    marginBottom: 12,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  userUsername: {
    color: '#666',
    fontSize: 12,
  },
  userMeta: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  roleChip: {
    marginBottom: 4,
    height: 29,
    textTransform:'capitalize'
  },
  lenderChip: {
    borderColor: '#ff6f00',
  },
  borrowerChip: {
    borderColor: '#1a237e',
  },
  roleChipText:{
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusChip: {
    height: 35,
    paddingHorizontal: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeChip: {
    backgroundColor: '#e8f5e8',
  },
  inactiveChip: {
    backgroundColor: '#ffebee',
  },
  userDetails: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 12,
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  deleteButton: {
    borderColor: '#d32f2f',
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

export default UserManagementScreen;
