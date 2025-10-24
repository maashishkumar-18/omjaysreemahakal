import React, { useState, useEffect } from 'react';
import { View, 
  StyleSheet, 
  ScrollView, 
  RefreshControl,
  SafeAreaView,
  StatusBar } from 'react-native';
import { Card, Title, Paragraph, Text, ActivityIndicator, Button } from 'react-native-paper';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { adminService } from '../../services/adminService';

const AdminDashboard = ({ navigation }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useSelector((state) => state.auth);

  const loadDashboardData = async () => {
    try {
      const response = await adminService.getDashboardStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1a237e" />
          <Text style={styles.loadingText}>Loading Dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
    <StatusBar backgroundColor="#1a237e" barStyle="light-content" />
    <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={true}
        
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Welcome, {user?.profile?.name || user?.username}!
        </Text>
        <Text style={styles.subtitle}>Admin Dashboard Overview</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Icon name="people" size={24} color="#1a237e" />
            <View style={styles.statText}>
              <Title style={styles.statNumber}>{stats?.overview?.totalLenders || 0}</Title>
              <Paragraph>Total Lenders</Paragraph>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Icon name="person" size={24} color="#1a237e" />
            <View style={styles.statText}>
              <Title style={styles.statNumber}>{stats?.overview?.totalBorrowers || 0}</Title>
              <Paragraph>Total Borrowers</Paragraph>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Icon name="account-balance" size={24} color="#1a237e" />
            <View style={styles.statText}>
              <Title style={styles.statNumber}>{stats?.overview?.activeLoans || 0}</Title>
              <Paragraph>Active Loans</Paragraph>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Icon name="payment" size={24} color="#1a237e" />
            <View style={styles.statText}>
              <Title style={styles.statNumber}>{stats?.overview?.pendingPayments || 0}</Title>
              <Paragraph>Pending Payments</Paragraph>
            </View>
          </Card.Content>
        </Card>
      </View>

      {/* Financial Overview */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Financial Overview</Title>
          <View style={styles.financialGrid}>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Total Amount Lent</Text>
              <Text style={styles.financialAmount}>
                ₹{stats?.financials?.totalAmountLent?.toLocaleString() || 0}
              </Text>
            </View>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Amount Repaid</Text>
              <Text style={styles.financialAmount}>
                ₹{stats?.financials?.totalAmountRepaid?.toLocaleString() || 0}
              </Text>
            </View>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Outstanding</Text>
              <Text style={[styles.financialAmount, styles.outstanding]}>
                ₹{stats?.financials?.outstandingBalance?.toLocaleString() || 0}
              </Text>
            </View>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Weekly Earnings</Text>
              <Text style={[styles.financialAmount, styles.earnings]}>
                ₹{stats?.financials?.weeklyEarnings?.toLocaleString() || 0}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Quick Actions</Title>
          <View style={styles.actionsGrid}>
            <Button
              mode="contained"
              icon="account-plus"
              onPress={() => navigation.navigate('CreateUser')}
              style={styles.actionButton}
              contentStyle={styles.buttonContent}
            >
              Add User
            </Button>
            <Button
              mode="contained"
              icon="store-plus"
              onPress={() => navigation.navigate('CreateLoan')}
              style={styles.actionButton}
              contentStyle={styles.buttonContent}
            >
              Create Loan
            </Button>
            <Button
              mode="contained"
              icon="credit-card"
              onPress={() => navigation.navigate('Payment Approval')}
              style={styles.actionButton}
              contentStyle={styles.buttonContent}
            >
              Approve Payments
            </Button>
            <Button
              mode="outlined"
              icon="format-list-bulleted"
              onPress={() => navigation.navigate('Loan Management')}
              style={styles.actionButton}
              contentStyle={styles.buttonContent}
            >
              View Loans
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Recent Activities */}
      {stats?.recentActivities && stats.recentActivities.length > 0 && (
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Recent Activities</Title>
            {stats.recentActivities.slice(0, 5).map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <Icon name="payment" size={20} color="#666" />
                <View style={styles.activityDetails}>
                  <Text style={styles.activityText}>
                    {activity.borrowerId?.name} paid ₹{activity.amount}
                  </Text>
                  <Text style={styles.activityDate}>
                    Loan: {activity.loanId?.loanId}
                  </Text>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}
    </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    marginBottom: 12,
    elevation: 2,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 12,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 0,
    color: '#1a237e',
  },
  sectionCard: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1a237e',
  },
  financialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  financialItem: {
    width: '48%',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  financialLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  financialAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  outstanding: {
    color: '#d32f2f',
  },
  earnings: {
    color: '#388e3c',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '100%',
    marginBottom: 12,
  },
  buttonContent: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityDetails: {
    marginLeft: 12,
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#212121',
  },
  activityDate: {
    fontSize: 12,
    color: '#666',
  },
  scrollContent: {
  flexGrow: 1,
  padding: 16,
  minHeight: 600, // ensures scroll works even if content is small
}
});

export default AdminDashboard;