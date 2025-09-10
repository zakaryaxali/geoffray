import React from 'react';
import { View, Image, Text, StyleSheet, Platform } from 'react-native';
import { useAssets } from 'expo-asset';

/**
 * Custom splash screen component that matches the Expo default splash screen style
 * but uses the custom logo.png image.
 */
export default function SplashScreen() {
  // Use the useAssets hook to load the logo image
  const [assets] = useAssets([require('../../assets/images/logo.png')]);
  
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        {assets ? (
          <Image
            source={{ uri: assets[0]?.uri }}
            style={styles.logo}
          />
        ) : Platform.OS === 'web' ? (
          // Fallback for web if asset loading fails
          <div 
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 'bold'
            }}
          >
            RV
          </div>
        ) : null}
      </View>
      <Text style={styles.appName}>geoffray</Text>
      <View style={styles.bottomIndicator} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  bottomIndicator: {
    position: 'absolute',
    bottom: 40,
    width: 134,
    height: 5,
    backgroundColor: '#E5E5E5',
    borderRadius: 100,
  },
});
