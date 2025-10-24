import React, { useState } from 'react';
import { View, StyleSheet, Image, Platform, ScrollView, Dimensions, SafeAreaView } from 'react-native';
import { TextInput, Button, Text, Card, RadioButton, Snackbar } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { Formik } from 'formik';
import * as Yup from 'yup';
import * as ImagePicker from 'expo-image-picker';

import { adminService } from '../../services/adminService';

const CreateUserScreen = ({ navigation }) => {
  const [qrCode, setQrCode] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const { user } = useSelector((state) => state.auth);

  // Pick image from gallery
  const pickQRCode = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) setQrCode(result.assets[0]);
    } catch (error) {
      console.error('Error picking QR code:', error);
      setSnackbar({ visible: true, message: 'Failed to pick QR code' });
    }
  };

  // Take photo
  const takeQRCodePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) setQrCode(result.assets[0]);
    } catch (error) {
      console.error('Error taking QR code photo:', error);
      setSnackbar({ visible: true, message: 'Failed to take QR code photo' });
    }
  };

  // Dynamic Yup schema based on role
  const getValidationSchema = (role) =>
    Yup.object().shape({
      role: Yup.string().required(),
      username: Yup.string()
        .required('Username is required')
        .min(3, 'Username must be at least 3 characters')
        .matches(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, underscores allowed'),
      password: Yup.string()
        .required('Password is required')
        .min(6, 'Password must be at least 6 characters'),
      name: Yup.string()
        .required('Name is required')
        .min(2, 'Name must be at least 2 characters'),
      phoneNumber: Yup.string()
        .required('Phone number is required')
        .matches(/^[6-9]\d{9}$/, 'Enter a valid Indian phone number'),
      address:
        role === 'borrower'
          ? Yup.string().required('Address is required for borrowers')
          : Yup.string(),
      upiId:
        role === 'lender'
          ? Yup.string().required('UPI ID is required for lenders')
          : Yup.string(),
    });

  console.log('Component rendered');

  // Handle form submission
  const handleCreateUser = async (values) => {
    console.log('handleCreateUser called with values:', values);
    if (values.role === 'lender' && !qrCode) {
      setSnackbar({ visible: true, message: 'QR code is required for lenders' });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();

      formData.append('role', values.role);
      formData.append('username', values.username);
      formData.append('password', values.password);
      formData.append('name', values.name);
      formData.append('phoneNumber', values.phoneNumber);

      if (values.role === 'borrower') formData.append('address', values.address);
      if (values.role === 'lender') {
        formData.append('upiId', values.upiId);
        if (qrCode) {
          // Convert image to FormData for React Native
          const localUri = qrCode.uri;
          const filename = localUri.split('/').pop();
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image`;

          // For React Native, we need to create a proper file object
          if (Platform.OS === 'web') {
            // For web, convert to blob
            const response = await fetch(localUri);
            const blob = await response.blob();
            formData.append('qrCode', blob, filename);
          } else {
            // For native platforms
            formData.append('qrCode', {
              uri: Platform.OS === 'android' ? localUri : localUri.replace('file://', ''),
              name: filename,
              type: type,
            });
          }
        }
      }
      console.log('Calling adminService.createUser with formData:', formData);
      await adminService.createUser(formData);

      setSnackbar({
        visible: true,
        message: `${values.role.charAt(0).toUpperCase() + values.role.slice(1)} created successfully!`,
      });

      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (error) {
      const message = error.response?.status === 404
        ? 'User not found'
        : (error.response?.data?.message || 'Failed to create user');
      setSnackbar({ visible: true, message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
    <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Create New User</Text>
        <Text style={styles.subtitle}>Add a new lender or borrower to the system</Text>
      </View>

      <Formik
        initialValues={{
          role: 'borrower',
          username: '',
          password: '',
          name: '',
          phoneNumber: '',
          address: '',
          upiId: '',
        }}
        validationSchema={(values) => {
          if (!values) return Yup.object().shape({});
          return Yup.object().shape({
            role: Yup.string().required(),
            username: Yup.string()
              .required('Username is required')
              .min(3, 'Username must be at least 3 characters')
              .matches(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, underscores allowed'),
            password: Yup.string()
              .required('Password is required')
              .min(6, 'Password must be at least 6 characters'),
            name: Yup.string()
              .required('Name is required')
              .min(2, 'Name must be at least 2 characters'),
            phoneNumber: Yup.string()
              .required('Phone number is required')
              .matches(/^[6-9]\d{9}$/, 'Enter a valid Indian phone number'),
            address: values.role === 'borrower' ? Yup.string().required('Address is required for borrowers') : Yup.string(),
            upiId: values.role === 'lender' ? Yup.string().required('UPI ID is required for lenders') : Yup.string(),
          });
        }}
        onSubmit={handleCreateUser}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => {
          console.log('Formik render - values:', values, 'errors:', errors, 'touched:', touched);

          return (
            <Card style={styles.formCard}>
              <Card.Content>
                {/* Role Selection */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Select Role</Text>
                  <RadioButton.Group onValueChange={handleChange('role')} value={values.role}>
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

                {/* Common Fields */}
                <TextInput
                  label="Username"
                  value={values.username}
                  onChangeText={handleChange('username')}
                  onBlur={handleBlur('username')}
                  mode="outlined"
                  error={touched.username && errors.username}
                  style={styles.input}
                />
                {touched.username && errors.username && <Text style={styles.errorText}>{errors.username}</Text>}

                <TextInput
                  label="Password"
                  value={values.password}
                  onChangeText={handleChange('password')}
                  onBlur={handleBlur('password')}
                  mode="outlined"
                  secureTextEntry
                  error={touched.password && errors.password}
                  style={styles.input}
                />
                {touched.password && errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

                <TextInput
                  label="Full Name"
                  value={values.name}
                  onChangeText={handleChange('name')}
                  onBlur={handleBlur('name')}
                  mode="outlined"
                  error={touched.name && errors.name}
                  style={styles.input}
                />
                {touched.name && errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

                <TextInput
                  label="Phone Number"
                  value={values.phoneNumber}
                  onChangeText={handleChange('phoneNumber')}
                  onBlur={handleBlur('phoneNumber')}
                  keyboardType="phone-pad"
                  mode="outlined"
                  error={touched.phoneNumber && errors.phoneNumber}
                  style={styles.input}
                />
                {touched.phoneNumber && errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}

                {/* Borrower Fields */}
                {values.role === 'borrower' && (
                  <TextInput
                    label="Address"
                    value={values.address}
                    onChangeText={handleChange('address')}
                    onBlur={handleBlur('address')}
                    mode="outlined"
                    multiline
                    numberOfLines={3}
                    error={touched.address && errors.address}
                    style={styles.input}
                  />
                )}

                {/* Lender Fields */}
                {values.role === 'lender' && (
                  <>
                    <TextInput
                      label="UPI ID"
                      value={values.upiId}
                      onChangeText={handleChange('upiId')}
                      onBlur={handleBlur('upiId')}
                      mode="outlined"
                      error={touched.upiId && errors.upiId}
                      style={styles.input}
                    />

                    {/* QR Code Upload */}
                    <View style={styles.qrSection}>
                      {qrCode ? (
                        <View style={styles.qrPreview}>
                          <Image source={{ uri: qrCode.uri }} style={styles.qrImage} />
                          <View style={styles.qrActions}>
                            <Button mode="outlined" onPress={() => setQrCode(null)} style={styles.qrButton}>
                              Remove
                            </Button>
                            <Button mode="outlined" onPress={pickQRCode} style={styles.qrButton}>
                              Change
                            </Button>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.uploadButtons}>
                          <Button mode="outlined" icon="photo-library" onPress={pickQRCode} style={styles.uploadButton}>
                            Gallery
                          </Button>
                          <Button mode="outlined" icon="photo-camera" onPress={takeQRCodePhoto} style={styles.uploadButton}>
                            Camera
                          </Button>
                        </View>
                      )}
                    </View>
                  </>
                )}

                <Button
                  mode="contained"
                  onPress={() => {
                    console.log('Button pressed');
                    handleSubmit();
                  }}
                  loading={submitting}
                  disabled={submitting || (values.role === 'lender' && !qrCode)}
                  style={styles.submitButton}
                  labelStyle={styles.submitButtonText}
                >
                  {submitting ? 'Creating User...' : `Create ${values.role.charAt(0).toUpperCase() + values.role.slice(1)}`}
                </Button>

                <Text style={styles.note}>
                  The user will be able to login immediately with the provided credentials.
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
        action={{ label: 'OK', onPress: () => setSnackbar({ ...snackbar, visible: false }) }}
      >
        {snackbar.message}
      </Snackbar>
      </ScrollView>
    </SafeAreaView>
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
    backgroundColor: '#f5f5f5',
    overflowY: Platform.OS === 'web' ? 'auto' : undefined,
  },
  scrollContent: {
    padding: 16,
    minHeight: Platform.OS === 'web' ? '100%' : undefined,
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
  submitButtonText: {
    color: '#ffffff',
  },
  note: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default CreateUserScreen;
