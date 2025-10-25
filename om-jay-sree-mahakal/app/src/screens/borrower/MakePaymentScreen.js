import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert, Platform } from 'react-native';
import { TextInput, Button, Text, Card, Title, Paragraph, RadioButton, ActivityIndicator, Snackbar } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { Formik } from 'formik';
import * as Yup from 'yup';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { loanService } from '../../services/loanService';

const PaymentSchema = Yup.object().shape({
  forDays: Yup.number()
    .required('Number of days is required')
    .min(1, 'Must be at least 1 day')
    .max(30, 'Cannot exceed 30 days'),
  utrNumber: Yup.string().optional(),
});

const MakePaymentScreen = ({ navigation }) => {
  const [lenderInfo, setLenderInfo] = useState(null);
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    loadLenderInfo();
    requestPermission();
  }, []);

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Sorry, we need camera roll permissions to upload payment screenshots.');
    }
  };

  const loadLenderInfo = async () => {
    try {
      const response = await loanService.getLenderQRCode();
      setLenderInfo(response.data);
    } catch (error) {
      console.error('Error loading lender info:', error);
      setSnackbar({ visible: true, message: 'Failed to load lender information' });
    } finally {
      setLoading(false);
    }
  };

  const pickScreenshot = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
      });

      if (!result.canceled) {
        setScreenshot(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setSnackbar({ visible: true, message: 'Failed to pick image' });
    }
  };

  const takeScreenshot = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setScreenshot(result.assets[0]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      setSnackbar({ visible: true, message: 'Failed to take photo' });
    }
  };

  const handleSubmitPayment = async (values) => {
    if (!screenshot) {
      setSnackbar({ visible: true, message: 'Please upload payment screenshot' });
      return;
    }

    setSubmitting(true);
    try {
      const totalAmount = lenderInfo.emiPerDay * parseInt(values.forDays || 1);

      const formData = new FormData();
      formData.append('amount', totalAmount.toString());
      formData.append('forDays', values.forDays);
      formData.append('utrNumber', values.utrNumber || '');

      // Convert image to FormData for React Native
      const localUri = screenshot.uri;
      const filename = localUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      // For React Native, we need to create a proper file object
      if (Platform.OS === 'web') {
        // For web, convert to blob
        const response = await fetch(localUri);
        const blob = await response.blob();
        formData.append('screenshot', blob, filename);
      } else {
        // For native platforms
        formData.append('screenshot', {
          uri: Platform.OS === 'android' ? localUri : localUri.replace('file://', ''),
          name: filename,
          type: type,
        });
      }

      console.log('Submitting payment with data:', {
        amount: totalAmount,
        forDays: values.forDays,
        utrNumber: values.utrNumber,
        hasScreenshot: !!screenshot
      });

      await loanService.submitPayment(formData);

      setSnackbar({
        visible: true,
        message: 'Payment submitted successfully! Waiting for admin approval.'
      });

      // Reset form
      setScreenshot(null);
      navigation.navigate('PaymentHistory');

    } catch (error) {
      console.error('Error submitting payment:', error);
      setSnackbar({
        visible: true,
        message: error.response?.data?.message || 'Failed to submit payment'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>Loading payment information...</Text>
      </View>
    );
  }

  if (!lenderInfo) {
    return (
      <View style={styles.center}>
        <Icon name="error-outline" size={64} color="#ccc" />
        <Text style={styles.errorText}>No active loan found</Text>
        <Text style={styles.errorSubtext}>
          You need an active loan to make payments
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Make Payment</Text>
        <Text style={styles.subtitle}>Pay your daily EMI using UPI</Text>
      </View>

      {/* Lender QR Code Section */}
      <Card style={styles.qrCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>Scan to Pay</Title>
          <Paragraph style={styles.cardSubtitle}>
            Scan the QR code using any UPI app
          </Paragraph>
          
          <View style={styles.qrContainer}>
            <Image 
              source={{ uri: lenderInfo.qrCodeUrl }} 
              style={styles.qrCode}
              resizeMode="contain"
            />
          </View>

          <View style={styles.lenderInfo}>
            <View style={styles.infoRow}>
              <Icon name="person" size={16} color="#666" />
              <Text style={styles.infoText}>Lender: {lenderInfo.lenderName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Icon name="payment" size={16} color="#666" />
              <Text style={styles.infoText}>UPI ID: {lenderInfo.upiId}</Text>
            </View>
            <View style={styles.infoRow}>
              <Icon name="money" size={16} color="#666" />
              <Text style={styles.infoText}>Daily EMI: ₹{lenderInfo.emiPerDay}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Payment Form */}
      <Formik
        initialValues={{ forDays: '1', utrNumber: '' }}
        validationSchema={PaymentSchema}
        onSubmit={handleSubmitPayment}
      >
        {({ 
          handleChange, 
          handleBlur, 
          handleSubmit, 
          values, 
          errors, 
          touched,
          setFieldValue 
        }) => {
          const totalAmount = lenderInfo.emiPerDay * parseInt(values.forDays || 1);

          return (
            <Card style={styles.formCard}>
              <Card.Content>
                <Title style={styles.cardTitle}>Payment Details</Title>

                {/* Days Selection */}
                <View style={styles.daysSection}>
                  <Text style={styles.sectionLabel}>Number of Days to Pay</Text>
                  <View style={styles.daysOptions}>
                    {[1, 3, 5, 7, 10, 15, 30].map((days) => (
                      <Button
                        key={days}
                        mode={values.forDays === days.toString() ? "contained" : "outlined"}
                        onPress={() => setFieldValue('forDays', days.toString())}
                        style={styles.dayButton}
                        compact
                      >
                        {days} Day{days > 1 ? 's' : ''}
                      </Button>
                    ))}
                  </View>
                  <TextInput
                    label="Custom Days"
                    value={values.forDays}
                    onChangeText={handleChange('forDays')}
                    onBlur={handleBlur('forDays')}
                    mode="outlined"
                    keyboardType="numeric"
                    style={styles.customInput}
                    error={touched.forDays && errors.forDays}
                  />
                  {touched.forDays && errors.forDays && (
                    <Text style={styles.errorText}>{errors.forDays}</Text>
                  )}
                </View>

                {/* Amount Display */}
                <View style={styles.amountSection}>
                  <Text style={styles.amountLabel}>Total Amount to Pay</Text>
                  <Text style={styles.amountValue}>₹{totalAmount.toLocaleString()}</Text>
                  <Text style={styles.amountBreakdown}>
                    ({lenderInfo.emiPerDay} × {values.forDays} days)
                  </Text>
                </View>

                {/* UTR Number */}
                <TextInput
                  label="UTR Number (Optional)"
                  value={values.utrNumber}
                  onChangeText={handleChange('utrNumber')}
                  onBlur={handleBlur('utrNumber')}
                  mode="outlined"
                  style={styles.input}
                  placeholder="Enter UTR number from your payment"
                />

                {/* Screenshot Upload */}
                <View style={styles.screenshotSection}>
                  <Text style={styles.sectionLabel}>Payment Screenshot</Text>
                  <Text style={styles.screenshotSubtext}>
                    Upload screenshot of successful payment from UPI app
                  </Text>
                  
                  {screenshot ? (
                    <View style={styles.screenshotPreview}>
                      <Image 
                        source={{ uri: screenshot.uri }} 
                        style={styles.screenshotImage}
                      />
                      <View style={styles.screenshotActions}>
                        <Button 
                          mode="outlined" 
                          onPress={() => setScreenshot(null)}
                          style={styles.screenshotButton}
                        >
                          Remove
                        </Button>
                        <Button 
                          mode="outlined" 
                          onPress={pickScreenshot}
                          style={styles.screenshotButton}
                        >
                          Change
                        </Button>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.uploadButtons}>
                      <Button 
                        mode="outlined" 
                        icon="photo-library" 
                        onPress={pickScreenshot}
                        style={styles.uploadButton}
                      >
                        Gallery
                      </Button>
                      <Button 
                        mode="outlined" 
                        icon="photo-camera" 
                        onPress={takeScreenshot}
                        style={styles.uploadButton}
                      >
                        Camera
                      </Button>
                    </View>
                  )}
                </View>

                {/* Submit Button */}
                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  loading={submitting}
                  disabled={submitting || !screenshot}
                  style={styles.submitButton}
                  contentStyle={styles.submitButtonContent}
                >
                  {submitting ? 'Submitting...' : 'Submit Payment for Approval'}
                </Button>

                <Text style={styles.note}>
                  Note: Payment will be verified by admin before approval. This may take up to 24 hours.
                </Text>
              </Card.Content>
            </Card>
          );
        }}
      </Formik>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={4000}
        action={{
          label: 'OK',
          onPress: () => setSnackbar({ ...snackbar, visible: false }),
        }}
      >
        {snackbar.message}
      </Snackbar>
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
  qrCard: {
    marginBottom: 16,
    elevation: 2,
  },
  formCard: {
    marginBottom: 20,
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
  lenderInfo: {
    marginTop: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  daysSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 12,
  },
  daysOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  dayButton: {
    margin: 2,
    marginBottom: 8,
  },
  customInput: {
    marginBottom: 8,
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#388e3c',
  },
  amountBreakdown: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  input: {
    marginBottom: 16,
  },
  screenshotSection: {
    marginBottom: 20,
  },
  screenshotSubtext: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  screenshotPreview: {
    alignItems: 'center',
  },
  screenshotImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
  screenshotActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  screenshotButton: {
    marginHorizontal: 4,
  },
  uploadButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  uploadButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: '#1a237e',
  },
  submitButtonContent: {
    height: 48,
  },
  note: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default MakePaymentScreen;
