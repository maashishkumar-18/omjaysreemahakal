import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Share, Alert } from 'react-native';
import { Card, Title, Paragraph, Text, Button, Chip, ActivityIndicator } from 'react-native-paper';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { loanService } from '../../services/loanService';

const LenderProfileScreen = () => {
  const [lenderData, setLenderData] = useState(null);
  const [loading, setLoading] = useState(true);

  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    loadLenderData();
  }, []);

  const loadLenderData = async () => {
    try {
      const response = await loanService.getLenderDashboard();
      setLenderData(response.data);
    } catch (error) {
      console.error('Error loading lender data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShareQR = async () => {
    if (!lenderData?.lender?.upiQrCodeUrl) {
      Alert.alert('Error', 'QR code not available');
      return;
    }

    try {
      await Share.share({
        message: `Scan to pay me via UPI: ${lenderData.lender.upiId}\nQR Code: ${lenderData.lender.upiQrCodeUrl}`,
        title: 'My UPI QR Code'
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share QR code');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
        <Text style={styles.subtitle}>Lender Information</Text>
      </View>

      {/* Profile Card */}
      <Card style={styles.profileCard}>
        <Card.Content>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {lenderData.lender.name?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Title style={styles.name}>{lenderData.lender.name}</Title>
              <Paragraph style={styles.role}>LENDER</Paragraph>
            </View>
          </View>

          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <Icon name="phone" size={16} color="#666" />
              <Text style={styles.contactText}>{lenderData.lender.phoneNumber}</Text>
            </View>
            <View style={styles.contactItem}>
              <Icon name="payment" size={16} color="#666" />
              <Text style={styles.contactText}>{lenderData.lender.upiId}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* QR Code Card */}
      <Card style={styles.qrCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>My UPI QR Code</Title>
          <Paragraph style={styles.cardSubtitle}>
            Share this with borrowers for payments
          </Paragraph>
          
          {lenderData.lender.upiQrCodeUrl ? (
            <View style={styles.qrContainer}>
              <Image 
                source={{ uri: lenderData.lender.upiQrCodeUrl }} 
                style={styles.qrCode}
                resizeMode="contain"
              />
            </View>
          ) : (
            <View style={styles.noQrContainer}>
              <Icon name="qr-code" size={64} color="#ccc" />
              <Text style={styles.noQrText}>QR Code Not Available</Text>
              <Text style={styles.noQrSubtext}>
                Contact admin to upload your UPI QR code
              </Text>
            </View>
          )}

          <Button
            mode="outlined"
            icon="share"
            onPress={handleShareQR}
            disabled={!lenderData.lender.upiQrCodeUrl}
            style={styles.shareButton}
          >
            Share QR Code
          </Button>
        </Card.Content>
      </Card>

      {/* Statistics Card */}
      <Card style={styles.statsCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>Lending Statistics</Title>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Icon name="account-balance" size={24} color="#1a237e" />
              <View style={styles.statText}>
                <Text style={styles.statNumber}>
                  ₹{lenderData.lender.totalAmountLent?.toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>Total Lent</Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <Icon name="trending-up" size={24} color="#1a237e" />
              <View style={styles.statText}>
                <Text style={styles.statNumber}>
                  ₹{lenderData.lender.totalEarnings?.toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>Total Earnings</Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <Icon name="list-alt" size={24} color="#1a237e" />
              <View style={styles.statText}>
                <Text style={styles.statNumber}>
                  {lenderData.lender.activeLoansCount}
                </Text>
                <Text style={styles.statLabel}>Active Loans</Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <Icon name="payments" size={24} color="#1a237e" />
              <View style={styles.statText}>
                <Text style={styles.statNumber}>
                  ₹{lenderData.summary?.totalAmountRecoverable?.toLocaleString() || 0}
                </Text>
                <Text style={styles.statLabel}>To Recover</Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Account Information */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>Account Information</Title>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Username</Text>
            <Text style={styles.infoValue}>{user.username}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>
              {new Date(user.createdAt).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Account Status</Text>
            <Chip 
              mode="flat"
              style={user.isActive ? styles.activeChip : styles.inactiveChip}
              textStyle={{ color: '#fff' }}
            >
              {user.isActive ? 'ACTIVE' : 'INACTIVE'}
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* Support Information */}
      <Card style={styles.supportCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>Need Help?</Title>
          <Paragraph style={styles.supportText}>
            For any issues with your account, payments, or loan assignments, 
            please contact the admin directly.
          </Paragraph>
          
          <Button
            mode="text"
            icon="help"
            onPress={() => {
              // Implement contact admin functionality
              Alert.alert('Contact Admin', 'Please call or message the admin for assistance.');
            }}
            style={styles.helpButton}
          >
            Contact Admin
          </Button>
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
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
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
  profileCard: {
    marginBottom: 16,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1a237e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 2,
  },
  role: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
  contactInfo: {
    marginTop: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  qrCard: {
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 8,
  },
  cardSubtitle: {
    color: '#666',
    marginBottom: 16,
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  qrCode: {
    width: 200,
    height: 200,
  },
  noQrContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noQrText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  noQrSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  shareButton: {
    marginTop: 8,
  },
  statsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  statText: {
    marginLeft: 12,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  infoCard: {
    marginBottom: 16,
    elevation: 2,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
  },
  activeChip: {
    backgroundColor: '#388e3c',
  },
  inactiveChip: {
    backgroundColor: '#d32f2f',
  },
  supportCard: {
    marginBottom: 20,
    elevation: 2,
  },
  supportText: {
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  helpButton: {
    alignSelf: 'flex-start',
  },
});

export default LenderProfileScreen;