import React, { useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text } from 'react-native-paper';

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    // Check authentication status or perform any initial loading
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: 'https://rukminim2.flixcart.com/image/480/480/xif0q/poster/a/5/r/small-spos8922-poster-lord-shiva-ji-maa-parvati-ji-photo-sl-9926-original-imaghs6bnqvasbfu.jpeg?q=90' }}
        style={styles.logo}
      />
      <Text style={styles.appName}>Om Jay Sree Mahakal</Text>
      <Text style={styles.tagline}>Money Lending App</Text>
      <Text style={styles.version}>Version 1.0.0</Text>
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
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a237e',
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  version: {
    fontSize: 12,
    color: '#999',
    position: 'absolute',
    bottom: 30,
  },
});

export default SplashScreen;