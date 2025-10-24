import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, SafeAreaView } from 'react-native';
import { TextInput, Button, Text, Card, Title, Snackbar, ActivityIndicator, Menu } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { adminService } from '../../services/adminService';
import { loanService } from '../../services/loanService';

const LoanSchema = Yup.object().shape({
  borrowerId: Yup.string().required('Borrower is required'),
  lenderId: Yup.string().required('Lender is required'),
  principalAmount: Yup.number()
    .required('Principal amount is required')
    .min(1, 'Amount must be greater than 0'),
  totalDays: Yup.number()
    .required('Loan period is required')
    .min(1, 'Must be at least 1 day')
    .max(3650, 'Cannot exceed 10 years'),
  emiPerDay: Yup.number()
    .required('EMI per day is required')
    .min(1, 'EMI must be greater than 0'),
  startDate: Yup.date().required('Start date is required'),
});

const CreateLoanScreen = ({ navigation }) => {
  const [borrowers, setBorrowers] = useState([]);
  const [lenders, setLenders] = useState([]);
  const [filteredBorrowers, setFilteredBorrowers] = useState([]);
  const [filteredLenders, setFilteredLenders] = useState([]);
  const [borrowerMenuVisible, setBorrowerMenuVisible] = useState(false);
  const [lenderMenuVisible, setLenderMenuVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const currentUser = useSelector(state => state.auth.user);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      console.log('Loading users for loan creation...');
      
      const [borrowersResponse, lendersResponse] = await Promise.all([
        adminService.getUsers({ role: 'borrower' }),
        adminService.getUsers({ role: 'lender' })
      ]);

      console.log('Borrowers response:', borrowersResponse);
      console.log('Lenders response:', lendersResponse);

      // Debug: Check the actual structure of the response
      const borrowerData = borrowersResponse.data.map(user => {
        console.log('Borrower user:', user);
        return {
          _id: user.profile?._id || user._id, // Try both possibilities
          userId: user._id,
          name: user.profile?.name || user.name,
          phoneNumber: user.profile?.phoneNumber || user.phoneNumber,
          address: user.profile?.address
        };
      });

      const lenderData = lendersResponse.data.map(user => {
        console.log('Lender user:', user);
        return {
          _id: user.profile?._id || user._id, // Try both possibilities
          userId: user._id,
          name: user.profile?.name || user.name,
          phoneNumber: user.profile?.phoneNumber || user.phoneNumber,
          upiId: user.profile?.upiId,
          upiQrCodeUrl: user.profile?.upiQrCodeUrl
        };
      });

      console.log('Processed borrowers:', borrowerData);
      console.log('Processed lenders:', lenderData);

      setBorrowers(borrowerData);
      setFilteredBorrowers(borrowerData);
      setLenders(lenderData);
      setFilteredLenders(lenderData);
    } catch (error) {
      console.error('Error loading users:', error);
      console.error('Error details:', error.response?.data);
      setSnackbar({ 
        visible: true, 
        message: `Failed to load users: ${error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const filterBorrowers = (query) => {
    if (!query) {
      setFilteredBorrowers(borrowers);
      return;
    }
    const filtered = borrowers.filter(borrower =>
      borrower.name?.toLowerCase().includes(query.toLowerCase()) ||
      borrower.phoneNumber?.includes(query)
    );
    setFilteredBorrowers(filtered);
  };

  const filterLenders = (query) => {
    if (!query) {
      setFilteredLenders(lenders);
      return;
    }
    const filtered = lenders.filter(lender =>
      lender.name?.toLowerCase().includes(query.toLowerCase()) ||
      lender.phoneNumber?.includes(query) ||
      lender.upiId?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredLenders(filtered);
  };

  const handleCreateLoan = async (values) => {
    setSubmitting(true);
    try {
      console.log('Creating loan with values:', values);
      console.log('Current user ID:', currentUser?._id);

      // Prepare loan data exactly as backend expects
      const loanData = {
        borrowerId: values.borrowerId,
        lenderId: values.lenderId,
        principalAmount: parseFloat(values.principalAmount),
        totalDays: parseInt(values.totalDays),
        emiPerDay: parseFloat(values.emiPerDay),
        startDate: values.startDate
      };

      console.log('Sending loan data to backend:', loanData);

      const response = await loanService.createLoan(loanData);
      console.log('Loan creation response:', response);

      setSnackbar({ 
        visible: true, 
        message: 'Loan created successfully!' 
      });
      
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
      
    } catch (error) {
      console.error('Error creating loan:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Failed to create loan';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Check for specific backend validation errors
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        errorMessage = 'Validation errors: ' + validationErrors.map(err => `${err.field}: ${err.message}`).join(', ');
      }

      setSnackbar({ 
        visible: true, 
        message: errorMessage 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const calculateEndDate = (startDate, totalDays) => {
    if (!startDate || !totalDays) return '';
    const start = new Date(startDate);
    const endDate = new Date(start);
    endDate.setDate(start.getDate() + parseInt(totalDays));
    return endDate.toISOString().split('T')[0];
  };

  const calculateTotalEMI = (emiPerDay, totalDays) => {
    if (!emiPerDay || !totalDays) return 0;
    return parseFloat(emiPerDay) * parseInt(totalDays);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
      <View style={styles.header}>
        <Text style={styles.title}>Create New Loan</Text>
        <Text style={styles.subtitle}>Assign a loan to a borrower with a lender</Text>
      </View>

      <Formik
        initialValues={{
          borrowerId: '',
          lenderId: '',
          principalAmount: '',
          totalDays: '',
          emiPerDay: '',
          startDate: new Date().toISOString().split('T')[0],
        }}
        validationSchema={LoanSchema}
        onSubmit={handleCreateLoan}
      >
        {({ 
          handleChange, 
          handleBlur, 
          handleSubmit, 
          values, 
          errors, 
          touched,
          setFieldValue,
          isValid
        }) => (
          <Card style={styles.formCard}>
            <Card.Content>
              {/* Borrower Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>
                  Select Borrower {values.borrowerId && `(Selected: ${borrowers.find(b => b._id === values.borrowerId)?.name})`}
                </Text>
                
                <Menu
                  visible={borrowerMenuVisible}
                  onDismiss={() => setBorrowerMenuVisible(false)}
                  style={styles.borrowerSelectionMenu}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => setBorrowerMenuVisible(true)}
                      style={styles.menuButton}
                      icon="person"
                    >
                      {values.borrowerId ?
                        borrowers.find(b => b._id === values.borrowerId)?.name || 'Select Borrower'
                        : 'Select Borrower'
                      }
                    </Button>
                  }
                >
                  <View style={styles.menuSearchContainer}>
                    <TextInput
                      placeholder="Search borrowers by name or phone..."
                      onChangeText={filterBorrowers}
                      mode="outlined"
                      style={styles.menuSearch}
                      left={<TextInput.Icon icon="search" />}
                    />
                  </View>
                  <ScrollView style={styles.menuScroll} nestedScrollEnabled>
                    {filteredBorrowers.length > 0 ? (
                      filteredBorrowers.map((borrower) => (
                        <Menu.Item
                          key={borrower._id}
                          onPress={() => {
                            console.log('Selected borrower:', borrower);
                            setFieldValue('borrowerId', borrower._id);
                            setBorrowerMenuVisible(false);
                          }}
                          title={borrower.name}
                          description={`Phone: ${borrower.phoneNumber} | ID: ${borrower._id}`}
                          style={styles.menuItem}
                        />
                      ))
                    ) : (
                      <Menu.Item
                        title="No borrowers found"
                        disabled
                        style={styles.menuItem}
                      />
                    )}
                  </ScrollView>
                </Menu>
                {touched.borrowerId && errors.borrowerId && (
                  <Text style={styles.errorText}>{errors.borrowerId}</Text>
                )}
              </View>

              {/* Lender Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>
                  Select Lender {values.lenderId && `(Selected: ${lenders.find(l => l._id === values.lenderId)?.name})`}
                </Text>
                
                <Menu
                  visible={lenderMenuVisible}
                  onDismiss={() => setLenderMenuVisible(false)}
                  style={styles.lenderSelectionMenu}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => setLenderMenuVisible(true)}
                      style={styles.menuButton}
                      icon="account-balance"
                    >
                      {values.lenderId ?
                        lenders.find(l => l._id === values.lenderId)?.name || 'Select Lender'
                        : 'Select Lender'
                      }
                    </Button>
                  }
                >
                  <View style={styles.menuSearchContainer}>
                    <TextInput
                      placeholder="Search lenders by name, phone or UPI..."
                      onChangeText={filterLenders}
                      mode="outlined"
                      style={styles.menuSearch}
                      left={<TextInput.Icon icon="search" />}
                    />
                  </View>
                  <ScrollView style={styles.menuScroll} nestedScrollEnabled>
                    {filteredLenders.length > 0 ? (
                      filteredLenders.map((lender) => (
                        <Menu.Item
                          key={lender._id}
                          onPress={() => {
                            console.log('Selected lender:', lender);
                            setFieldValue('lenderId', lender._id);
                            setLenderMenuVisible(false);
                          }}
                          title={lender.name}
                          description={`UPI: ${lender.upiId} | Phone: ${lender.phoneNumber} | ID: ${lender._id}`}
                          style={styles.menuItem}
                        />
                      ))
                    ) : (
                      <Menu.Item
                        title="No lenders found"
                        disabled
                        style={styles.menuItem}
                      />
                    )}
                  </ScrollView>
                </Menu>
                {touched.lenderId && errors.lenderId && (
                  <Text style={styles.errorText}>{errors.lenderId}</Text>
                )}
              </View>

              {/* Loan Details */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Loan Details</Text>
                
                <TextInput
                  label="Principal Amount (₹)"
                  value={values.principalAmount}
                  onChangeText={handleChange('principalAmount')}
                  onBlur={handleBlur('principalAmount')}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.input}
                  error={touched.principalAmount && errors.principalAmount}
                  left={<TextInput.Icon icon="currency-inr" />}
                />
                {touched.principalAmount && errors.principalAmount && (
                  <Text style={styles.errorText}>{errors.principalAmount}</Text>
                )}

                <TextInput
                  label="Loan Period (Days)"
                  value={values.totalDays}
                  onChangeText={handleChange('totalDays')}
                  onBlur={handleBlur('totalDays')}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.input}
                  error={touched.totalDays && errors.totalDays}
                  left={<TextInput.Icon icon="calendar-range" />}
                />
                {touched.totalDays && errors.totalDays && (
                  <Text style={styles.errorText}>{errors.totalDays}</Text>
                )}

                <TextInput
                  label="EMI Per Day (₹)"
                  value={values.emiPerDay}
                  onChangeText={handleChange('emiPerDay')}
                  onBlur={handleBlur('emiPerDay')}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.input}
                  error={touched.emiPerDay && errors.emiPerDay}
                  left={<TextInput.Icon icon="cash" />}
                />
                {touched.emiPerDay && errors.emiPerDay && (
                  <Text style={styles.errorText}>{errors.emiPerDay}</Text>
                )}

                <TextInput
                  label="Start Date (YYYY-MM-DD)"
                  value={values.startDate}
                  onChangeText={handleChange('startDate')}
                  onBlur={handleBlur('startDate')}
                  mode="outlined"
                  style={styles.input}
                  error={touched.startDate && errors.startDate}
                  left={<TextInput.Icon icon="calendar" />}
                  placeholder="YYYY-MM-DD"
                />
                {touched.startDate && errors.startDate && (
                  <Text style={styles.errorText}>{errors.startDate}</Text>
                )}
              </View>

              {/* Loan Summary */}
              {values.principalAmount && values.totalDays && values.emiPerDay && (
                <Card style={styles.summaryCard}>
                  <Card.Content>
                    <Title style={styles.summaryTitle}>Loan Summary</Title>
                    
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Principal Amount:</Text>
                      <Text style={styles.summaryValue}>
                        ₹{parseFloat(values.principalAmount).toLocaleString()}
                      </Text>
                    </View>
                    
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Daily EMI:</Text>
                      <Text style={styles.summaryValue}>
                        ₹{parseFloat(values.emiPerDay).toLocaleString()}
                      </Text>
                    </View>
                    
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Loan Duration:</Text>
                      <Text style={styles.summaryValue}>
                        {values.totalDays} days
                      </Text>
                    </View>
                    
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Total Repayable:</Text>
                      <Text style={styles.summaryValue}>
                        ₹{calculateTotalEMI(values.emiPerDay, values.totalDays).toLocaleString()}
                      </Text>
                    </View>
                    
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Start Date:</Text>
                      <Text style={styles.summaryValue}>{values.startDate}</Text>
                    </View>
                    
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Expected End Date:</Text>
                      <Text style={styles.summaryValue}>
                        {calculateEndDate(values.startDate, values.totalDays)}
                      </Text>
                    </View>
                  </Card.Content>
                </Card>
              )}

              {/* Submit Button */}
              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={submitting}
                disabled={submitting || !isValid || !values.borrowerId || !values.lenderId}
                style={styles.submitButton}
                contentStyle={styles.submitButtonContent}
              >
                {submitting ? 'Creating Loan...' : 'Create Loan'}
              </Button>

              <Text style={styles.note}>
                The loan will be immediately active and the borrower can start making payments.
              </Text>
            </Card.Content>
          </Card>
        )}
      </Formik>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={6000}
        action={{
          label: 'OK',
          onPress: () => setSnackbar({ ...snackbar, visible: false }),
        }}
      >
        {snackbar.message}
      </Snackbar>
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    height: Platform.OS === 'web' ? '100vh' : undefined,
  },
  container: {
    flex: 1,
    ...(Platform.OS === 'web' && {
      minHeight: '100vh', // ✅ ensures scroll height is calculated properly
      overflowY: 'auto', // ✅ enables web scrolling
    }),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    marginBottom: 12,
  },
  formCard: {
    marginBottom: 20,
    elevation: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 12,
  },
  menuButton: {
    width: '100%',
    justifyContent: 'space-between',
  },
  menuSearchContainer: {
    padding: 8,
  },
  menuSearch: {
    marginBottom: 8,
  },
  menuScroll: {
    maxHeight: 200,
  },
  menuItem: {
    maxWidth: '100%',
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 4,
  },
  debugCard: {
    marginBottom: 16,
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#856404',
  },
  summaryCard: {
    marginBottom: 20,
    backgroundColor: '#e8f5e8',
    borderColor: '#388e3c',
    borderWidth: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#212121',
    flex: 1,
    textAlign: 'right',
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
  borrowerSelectionMenu: {
    maxWidth: '90%',
    width: '90%',
    maxHeight: 400,
  },
  lenderSelectionMenu: {
    maxWidth: '90%',
    width: '90%',
    maxHeight: 400,
  },
});

export default CreateLoanScreen;