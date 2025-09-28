/**
 * API configuration for different environments
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';

type Environment = 'local' | 'development' | 'staging' | 'production';

interface ApiConfig {
  baseUrl: string;
  timeout: number;
}

// Get the API URL from Expo Constants or fallback to a reasonable default
const getApiUrl = (): string => {
  // First check if we have EXPO_PUBLIC_API_URL environment variable (runtime configuration)
  // This is set in docker-compose.staging.yml and takes precedence
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Then check if we have an API URL from app.config.js (build-time configuration)
  const configApiUrl = Constants.expoConfig?.extra?.apiUrl;
  if (configApiUrl) {
    return configApiUrl;
  }

  // Determine environment from Constants
  const environment = Constants.expoConfig?.extra?.environment as Environment || 'development';
  
  // Fallback configurations if not using app.config.js
  if (environment === 'local') {
    // For local environment
    // IMPORTANT: When testing on a physical device, replace this with your computer's
    // actual IP address on the same network as your phone
    const LOCAL_IP = '192.168.86.24'; // Replace with your actual local IP address
    
    // On physical devices, use the developer's machine IP address
    if (Platform.OS !== 'web') {
      return `http://${LOCAL_IP}:8080`;
    }
    
    // On web or simulator, use localhost
    return 'http://localhost:8080';
  }
  
  if (environment === 'staging') {
    // For staging environment, use the staging server
    return 'https://91.98.207.252/api';
  }
  
  // For development and production, use the local geoffray API
  return 'http://localhost:8080';
};

const configs: Record<Environment, ApiConfig> = {
  development: {
    baseUrl: getApiUrl(),
    timeout: 10000,
  },
  local: {
    baseUrl: getApiUrl(),
    timeout: 10000,
  },
  staging: {
    baseUrl: getApiUrl(),
    timeout: 10000,
  },
  production: {
    baseUrl: getApiUrl(),
    timeout: 10000,
  },
};

// Determine current environment
const getCurrentEnvironment = (): Environment => {
  // Check environment from Expo configuration
  const environment = Constants.expoConfig?.extra?.environment as Environment;
  if (environment) {
    return environment;
  }
  
  // Fallback to __DEV__ check if Expo config is not available
  if (__DEV__) {
    return 'development';
  }
  
  return 'production';
};

export const apiConfig = configs[getCurrentEnvironment()];

// For debugging purposes
console.log(`API is connecting to: ${apiConfig.baseUrl} (${getCurrentEnvironment()} environment)`);


