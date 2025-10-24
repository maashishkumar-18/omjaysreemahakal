import React from 'react';
import { View, StyleSheet, ScrollView, Image, Share, Alert } from 'react-native';
import { Card, Title, Paragraph, Text, Button, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

const LenderQRCodeScreen = ({ route }) => {
  const { lenderInfo } = route.params || {};

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Pay ${lenderInfo.lenderName} via UPI: ${lenderInfo.upiId}\nQR Code: ${lenderInfo.qrCodeUrl}`,
        title: 'UPI Payment Details'
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share payment details');
    }
  };

  if (!lenderInfo) {
    return (
      <View style={styles.center}>
        <Icon name="error-outline" size={64} color="#ccc" />
        <Text style={styles.errorText}>No lender information available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lender UPI QR Code</Text>
        <Text style={styles.subtitle}>Scan to make payments</Text>
      </View>

      <Card style={styles.qrCard}>
        <Card.Content style={styles.qrContent}>
          <View style={styles.qrContainer}>
            <Image 
              source={{ uri: lenderInfo.qrCodeUrl }} 
              style={styles.qrCode}
              resizeMode="contain"
            />
          </View>
          
          <Title style={styles.lenderName}>{lenderInfo.lenderName}</Title>
          
          <View style={styles.upiSection}>
            <Text style={styles.upiLabel}>UPI ID:</Text>
            <View style={styles.upiContainer}>
              <Text style={styles.upiId}>{lenderInfo.upiId}</Text>
              <Button 
                mode="text" 
                compact
                onPress={() => {
                  // Copy to clipboard functionality would go here
                  Alert.alert('Copied', 'UPI ID copied to clipboard');
                }}
              >
                Copy
              </Button>
            </View>
          </View>

          <View style={styles.emiInfo}>
            <Chip mode="outlined" style={styles.emiChip}>
              Daily EMI: ₹{lenderInfo.emiPerDay}
            </Chip>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.instructionsCard}>
        <Card.Content>
          <Title style={styles.instructionsTitle}>How to Pay</Title>
          
          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>1</Text>
            </View>
            <Text style={styles.instructionText}>
              Open any UPI app (Google Pay, PhonePe, Paytm, etc.)
            </Text>
          </View>

          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>2</Text>
            </View>
            <Text style={styles.instructionText}>
              Tap on "Scan QR Code" and scan the code above
            </Text>
          </View>

          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>3</Text>
            </View>
            <Text style={styles.instructionText}>
              Enter the amount (Daily EMI × Number of days)
            </Text>
          </View>

          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>4</Text>
            </View>
            <Text style={styles.instructionText}>
              Complete the payment and take a screenshot
            </Text>
          </View>

          <View style={styles.instructionStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>5</Text>
            </View>
            <Text style={styles.instructionText}>
              Upload the screenshot in the "Make Payment" section
            </Text>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.actions}>
        <Button
          mode="contained"
          icon="share"
          onPress={handleShare}
          style={styles.shareButton}
        >
          Share Payment Details
        </Button>
      </View>
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
  errorText: {
    fontSize: 16,
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
  qrCard: {
    marginBottom: 16,
    elevation: 2,
  },
  qrContent: {
    alignItems: 'center',
  },
  qrContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 20,
  },
  qrCode: {
    width: 250,
    height: 250,
  },
  lenderName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 16,
  },
  upiSection: {
    width: '100%',
    marginBottom: 16,
  },
  upiLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  upiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  upiId: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    flex: 1,
  },
  emiInfo: {
    marginTop: 8,
  },
  emiChip: {
    backgroundColor: '#e8f5e8',
    borderColor: '#388e3c',
  },
  instructionsCard: {
    marginBottom: 20,
    elevation: 2,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 16,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1a237e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actions: {
    marginBottom: 20,
  },
  shareButton: {
    backgroundColor: '#1a237e',
  },
});

export default LenderQRCodeScreen;