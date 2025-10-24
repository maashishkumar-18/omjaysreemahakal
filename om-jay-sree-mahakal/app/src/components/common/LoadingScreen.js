import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

const LoadingScreen = () => {
  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: 'https://rukminim2.flixcart.com/image/480/480/xif0q/poster/a/5/r/small-spos8922-poster-lord-shiva-ji-maa-parvati-ji-photo-sl-9926-original-imaghs6bnqvasbfu.jpeg?q=90' }}
        style={styles.logo}
      />
      <Text style={styles.appName}>Om Jay Sree Mahakal</Text>
      <ActivityIndicator size="large" color="#1a237e" style={styles.loader} />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 30,
  },
  loader: {
    marginBottom: 10,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});

export default LoadingScreen;