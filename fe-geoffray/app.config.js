// app.config.js - Dynamic configuration for Expo builds
const { getDefaultConfig } = require('expo/metro-config');

// Get the app environment or default to development
const getAppEnv = () => {
  return process.env.APP_ENV || 'development';
};

// Define configuration for each environment
const envConfig = {
  local: {
    name: 'Geoffray (Local)',
    slug: 'fe-geoffray', // Same slug for all environments
    scheme: 'geoffraylocal',
    extra: {
      apiUrl: 'http://localhost:8080',
      eas: {
        projectId: '8e1b564f-84b4-4cd2-81fb-4f146ae360e6',
      },
      environment: 'local',
    },
  },
  development: {
    name: 'Geoffray (Dev)',
    slug: 'fe-geoffray', // Match the project slug with Expo's expectations
    icon: './assets/images/icon-dev.png', // You can create a dev icon with a badge
    scheme: 'geoffraydev',
    extra: {
      apiUrl: 'http://localhost:8080',
      eas: {
        projectId: '8e1b564f-84b4-4cd2-81fb-4f146ae360e6',
      },
      environment: 'development',
    },
  },
  production: {
    name: 'Geoffray',
    slug: 'fe-geoffray', // Same slug for all environments
    scheme: 'geoffray',
    extra: {
      apiUrl: 'http://localhost:8080',
      eas: {
        projectId: '8e1b564f-84b4-4cd2-81fb-4f146ae360e6',
      },
      environment: 'production',
    },
  },
};

// Get the environment-specific configuration
const getEnvConfig = () => {
  const env = getAppEnv();
  console.log(`Building app for environment: ${env}`);
  return envConfig[env] || envConfig.development;
};

module.exports = ({ config }) => {
  // Load the environment configuration
  const envSpecificConfig = getEnvConfig();
  
  // Merge with the base config
  return {
    ...config,
    ...envSpecificConfig,
    // Common configurations across all environments
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    updates: {
      fallbackToCacheTimeout: 0,
      url: 'https://u.expo.dev/8e1b564f-84b4-4cd2-81fb-4f146ae360e6', // Replace with your project's update URL
    },
    runtimeVersion: '1.0.0',
    assetBundlePatterns: ['**/*'],
    ios: {
      ...(config.ios || {}),
      supportsTablet: true,      
      // bundleIdentifier: 'space.dataeng.rendezvous', i would prefer this but cannot change android bundle id now
      bundleIdentifier: `com.geoffray.${envSpecificConfig.extra.environment}`,
      buildNumber: '1.0.0',
    },
    android: {
      ...(config.android || {}),
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      // bundleIdentifier: 'space.dataeng.rendezvous', i would prefer this but cannot change android bundle id now
      package: `com.geoffray.${envSpecificConfig.extra.environment}`,
      versionCode: 1,
    },
    web: {
      ...(config.web || {}),
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      ...(config.plugins || []),
      'expo-router',
      'expo-font',
      'expo-secure-store',
    ],
    extra: {
      ...(config.extra || {}),
      ...envSpecificConfig.extra,
      eas: {
        ...(config.extra?.eas || {}),
        ...envSpecificConfig.extra.eas,
      },
    },
  };
};
