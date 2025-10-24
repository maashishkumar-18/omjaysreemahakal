import React, { useState } from 'react';
import { View, StyleSheet, Image, ScrollView } from 'react-native';
import { TextInput, Button, Text, Snackbar } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { Formik } from 'formik';
import * as Yup from 'yup';

import { loginStart, loginSuccess, loginFailure } from '../../store/slices/authSlice';
import { authService } from '../../services/authService';

const LoginSchema = Yup.object().shape({
  username: Yup.string().required('Username is required'),
  password: Yup.string().required('Password is required'),
});

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const handleLogin = async (values) => {
  try {
    dispatch(loginStart());
    const response = await authService.login(values.username, values.password);
    console.log('Login response:', response);

    if (!response || !response.user) {
      throw new Error('Invalid response from backend');
    }

    dispatch(loginSuccess({
      user: response.user,
      token: response.token,
    }));

    setSnackbarVisible(false);
    //navigation.navigate('AdminDashboard'); // Navigate after successful login
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Login failed';
    dispatch(loginFailure(errorMessage));
    setSnackbarVisible(true);
  }
};


  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Image 
          source={{ uri: 'https://rukminim2.flixcart.com/image/480/480/xif0q/poster/a/5/r/small-spos8922-poster-lord-shiva-ji-maa-parvati-ji-photo-sl-9926-original-imaghs6bnqvasbfu.jpeg?q=90' }}
          style={styles.logo}
        />
        <Text style={styles.appName}>Om Jay Sree Mahakal</Text>
        <Text style={styles.subtitle}>Money Lending App</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.loginTitle}>Login to Your Account</Text>
        
        <Formik
          initialValues={{ username: '', password: '' }}
          validationSchema={LoginSchema}
          onSubmit={handleLogin}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <View style={styles.form}>
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

              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={loading}
                disabled={loading}
                style={styles.loginButton}
                contentStyle={styles.buttonContent}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>

              <Text style={styles.note}>
                Note: Please contact admin for username and password
              </Text>
            </View>
          )}
        </Formik>
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {error}
      </Snackbar>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  formContainer: {
    flex: 1,
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#212121',
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 4,
  },
  loginButton: {
    marginTop: 16,
    paddingVertical: 6,
    backgroundColor: '#1a237e',
  },
  buttonContent: {
    height: 48,
  },
  note: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default LoginScreen;