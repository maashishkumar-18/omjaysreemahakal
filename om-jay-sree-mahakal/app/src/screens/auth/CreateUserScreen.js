import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { TextInput, Button, Text, Card, Title, RadioButton, Snackbar, ActivityIndicator } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { Formik } from 'formik';
import * as Yup from 'yup';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { adminService } from '../../services/adminService';

const UserSchema = Yup.object().shape({
  username: Yup.string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: Yup.string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
  name: Yup.string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters'),
  phoneNumber: Yup.string()
    .required('Phone number is required')
    .matches(/^[6-9]\d{9}$/, 'Please enter a valid Indian phone number'),
  address: Yup.string().when('role', {
    is: 'borrower',
    then: Yup.string().required('Address is required for borrowers'),
    otherwise: Yup.string().notRequired()
  }),
  upiId: Yup.string().when('role', {
    is: 'lender',
    then: Yup.string().required('UPI ID is required for lenders'),
    otherwise: Yup.string().notRequired()
  }),
});

const CreateUserScreen = ({ navigation }) => {
  const [role, setRole] = useState('borrower');
  const [qrCode, setQrCode] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const { user } = useSelector((state) => state.auth);

  const pickQRCode = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setQrCode(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking QR code:', error);
      setSnackbar({ visible: true, message: 'Failed to pick QR code image' });
    }
  };

  const takeQRCodePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setQrCode(result.assets[0]);
      }
    } catch (error) {
      console.error('Error taking QR code photo:', error);
      setSnackbar({ visible: true, message: 'Failed to take QR code photo' });
    }
  };

  const handleCreateUser = async (values) => {
    if (role === 'lender' && !qrCode) {
      setSnackbar({ visible: true, message: 'QR code is required for lenders' });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      
      // Add common fields
      formData.append('role', role);
      formData.append('username', values.username);
      formData.append('password', values.password);
      formData.append('name', values.name);
      formData.append('phoneNumber', values.phoneNumber);

      // Add role-specific fields
      if (role === 'borrower') {
        formData.append('address', values.address);
      } else if (role === 'lender') {
        formData.append('upiId', values.upiId);
        
        // Convert QR code image to FormData
        const localUri = qrCode.uri;
        const filename = localUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        formData.append('qrCode', {
          uri: localUri,
          name: filename,
          type,
        });
      }

      await adminService.createUser(formData);
      
      setSnackbar({ 
        visible: true, 
        message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully!` 
      });
      
      // Reset form and navigate back
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
      
    } catch (error) {
      console.error('Error creating user:', error);
      setSnackbar({ 
        visible: true, 
        message: error.response?.data?.message || 'Failed to create user' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create New User</Text>
        <Text style={styles.subtitle}>Add a new lender or borrower to the system</Text>
      </View>

      <Formik
        initialValues={{
          username: '',
          password: '',
          name: '',
          phoneNumber: '',
          address: '',
          upiId: '',
        }}
        validationSchema={UserSchema}
        onSubmit={handleCreateUser}
      >
        {({ 
          handleChange, 
          handleBlur, 
          handleSubmit, 
          values, 
          errors, 
          touched,
          setFieldValue 
        }) => (
          <Card style={styles.formCard}>
            <Card.Content>
              {/* Role Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Select Role</Text>
                <View style={styles.roleOptions}>
                  <RadioButton.Group onValueChange={setRole} value={role}>
                    <View style={styles.radioOption}>
                      <RadioButton value="borrower" />
                      <Text style={styles.radioLabel}>Borrower</Text>
                    </View>
                    <View style={styles.radioOption}>
                      <RadioButton value="lender" />
                      <Text style={styles.radioLabel}>Lender</Text>
                    </View>
                  </RadioButton.Group>
                </View>
              </View>

              {/* Common Fields */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Basic Information</Text>
                
                <TextInput
                  label="Username"
                  value={values.username}
                  onChangeText={handleChange('username')}
                  onBlur={handleBlur('username')}
                  mode="outlined"
                  style={styles.input}
                  error={touched.username && errors.username}
                  left={<TextInput.Icon icon="account" />}
                />
                {touched.username && errors.username && (
                  <Text style={styles.errorText}>{errors.username}</Text>
                )}

                <TextInput
                  label="Password"
                  value={values.password}
                  onChangeText={handleChange('password')}
                  onBlur={handleBlur('password')}
                  mode="outlined"
                  secureTextEntry
                  style={styles.input}
                  error={touched.password && errors.password}
                  left={<TextInput.Icon icon="lock" />}
                />
                {touched.password && errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}

                <TextInput
                  label="Full Name"
                  value={values.name}
                  onChangeText={handleChange('name')}
                  onBlur={handleBlur('name')}
                  mode="outlined"
                  style={styles.input}
                  error={touched.name && errors.name}
                  left={<TextInput.Icon icon="badge" />}
                />
                {touched.name && errors.name && (
                  <Text style={styles.errorText}>{errors.name}</Text>
                )}

                <TextInput
                  label="Phone Number"
                  value={values.phoneNumber}
                  onChangeText={handleChange('phoneNumber')}
                  onBlur={handleBlur('phoneNumber')}
                  mode="outlined"
                  keyboardType="phone-pad"
                  style={styles.input}
                  error={touched.phoneNumber && errors.phoneNumber}
                  left={<TextInput.Icon icon="phone" />}
                />
                {touched.phoneNumber && errors.phoneNumber && (
                  <Text style={styles.errorText}>{errors.phoneNumber}</Text>
                )}
              </View>

              {/* Borrower Specific Fields */}
              {role === 'borrower' && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Borrower Information</Text>
                  
                  <TextInput
                    label="Address"
                    value={values.address}
                    onChangeText={handleChange('address')}
                    onBlur={handleBlur('address')}
                    mode="outlined"
                    multiline
                    numberOfLines={3}
                    style={styles.input}
                    error={touched.address && errors.address}
                    left={<TextInput.Icon icon="home" />}
                  />
                  {touched.address && errors.address && (
                    <Text style={styles.errorText}>{errors.address}</Text>
                  )}
                </View>
              )}

              {/* Lender Specific Fields */}
              {role === 'lender' && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Lender Information</Text>
                  
                  <TextInput
                    label="UPI ID"
                    value={values.upiId}
                    onChangeText={handleChange('upiId')}
                    onBlur={handleBlur('upiId')}
                    mode="outlined"
                    style={styles.input}
                    placeholder="e.g., name@upi"
                    error={touched.upiId && errors.upiId}
                    left={<TextInput.Icon icon="payment" />}
                  />
                  {touched.upiId && errors.upiId && (
                    <Text style={styles.errorText}>{errors.upiId}</Text>
                  )}

                  {/* QR Code Upload */}
                  <View style={styles.qrSection}>
                    <Text style={styles.qrLabel}>UPI QR Code</Text>
                    <Text style={styles.qrSubtext}>
                      Upload a clear image of the lender's UPI QR code
                    </Text>
                    
                    {qrCode ? (
                      <View style={styles.qrPreview}>
                        <Image 
                          source={{ uri: qrCode.uri }} 
                          style={styles.qrImage}
                        />
                        <View style={styles.qrActions}>
                          <Button 
                            mode="outlined" 
                            onPress={() => setQrCode(null)}
                            style={styles.qrButton}
                          >
                            Remove
                          </Button>
                          <Button 
                            mode="outlined" 
                            onPress={pickQRCode}
                            style={styles.qrButton}
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
                          onPress={pickQRCode}
                          style={styles.uploadButton}
                        >
                          Gallery
                        </Button>
                        <Button 
                          mode="outlined" 
                          icon="photo-camera" 
                          onPress={takeQRCodePhoto}
                          style={styles.uploadButton}
                        >
                          Camera
                        </Button>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Submit Button */}
              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={submitting}
                disabled={submitting || (role === 'lender' && !qrCode)}
                style={styles.submitButton}
                contentStyle={styles.submitButtonContent}
              >
                {submitting ? 'Creating User...' : `Create ${role.charAt(0).toUpperCase() + role.slice(1)}`}
              </Button>

              <Text style={styles.note}>
                The user will be able to login immediately with the provided credentials.
              </Text>
            </Card.Content>
          </Card>
        )}
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
    marginBottom: 16,
  },
  roleOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioLabel: {
    marginLeft: 8,
    fontSize: 16,
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
  qrSection: {
    marginTop: 16,
  },
  qrLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  qrSubtext: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  qrPreview: {
    alignItems: 'center',
  },
  qrImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
  qrActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  qrButton: {
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

export default CreateUserScreen;