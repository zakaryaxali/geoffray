import {DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider} from '@react-navigation/native';
import {useFonts} from 'expo-font';
import {Stack, useRouter, useSegments} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {StatusBar} from 'expo-status-bar';
import {useEffect, useState} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import 'react-native-reanimated';

import CustomSplashScreen from '@/src/components/SplashScreen';

import {ThemeProvider} from '@/src/contexts/ThemeContext';
import {AuthProvider, useAuth} from '@/src/contexts/AuthContext';
import {LocalizationProvider} from '@/src/localization/LocalizationContext';
import initI18n from '@/src/localization/i18n';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {
  /* Ignore errors as they're just warnings about splash screen already hidden */
});

// This function ensures protected routes redirect to auth if not signed in
function RootLayoutNav() {
  const { user, isLoading, isAuthenticated, authError, clearError } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useEffect(() => {
    // Wait for auth loading to complete before handling navigation
    if (isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === 'auth';
    const inInviteGroup = segments[0] === 'invite';
    const isPrivacyPolicy = segments[0] === 'privacy-policy';
    const isPublicRoute = inAuthGroup || inInviteGroup || isPrivacyPolicy;
    
    // Handle authentication-based navigation
    if (!isAuthenticated && !isPublicRoute) {
      // Clear any existing auth errors when redirecting to login
      if (authError) {
        clearError();
      }
      // Redirect to the login page if not signed in and not in allowed public routes
      router.replace('/auth/login');
    } else if (isAuthenticated && user && inAuthGroup) {
      // Redirect to the main app if signed in and trying to access auth routes
      router.replace('/home');
    }

    setIsNavigationReady(true);
  }, [user, isAuthenticated, isLoading, segments, authError, clearError, router]);

  // Show loading screen while auth is initializing
  if (isLoading || !isNavigationReady) {
    return <CustomSplashScreen />;
  }

  // Show auth error overlay if there's a critical auth error
  if (authError && authError.type === 'network' && !isAuthenticated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, marginBottom: 10, textAlign: 'center' }}>
          Authentication Error
        </Text>
        <Text style={{ fontSize: 14, marginBottom: 20, textAlign: 'center', color: '#666' }}>
          {authError.message}
        </Text>
        <TouchableOpacity 
          onPress={() => {
            clearError();
            router.replace('/auth/login');
          }}
          style={{ 
            backgroundColor: '#007AFF', 
            padding: 15, 
            borderRadius: 8,
            minWidth: 120,
            alignItems: 'center'
          }}
        >
          <Text style={{ color: 'white', fontSize: 16 }}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="event/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="invite/[code]" options={{ headerShown: true }} />
      <Stack.Screen name="create-event-with-gifts/index" options={{ headerShown: false }} />
      <Stack.Screen name="create-event-with-gifts/occasions/[persona]" options={{ headerShown: false }} />
      <Stack.Screen name="create-event-with-gifts/details/[persona]/[occasion]" options={{ headerShown: false }} />
      <Stack.Screen name="privacy-policy/index" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [isI18nInitialized, setIsI18nInitialized] = useState(false);

  useEffect(() => {
    // Initialize i18n only on the client-side
    initI18n()
      .then(() => {
        setIsI18nInitialized(true);
      })
      .catch(error => {
        console.error('Failed to initialize i18n:', error);
      });
  }, []); // Empty dependency array ensures this runs only once on mount

  useEffect(() => {
    if (loaded && isI18nInitialized) {
      // Hide the splash screen once everything is loaded
      SplashScreen.hideAsync().catch(() => {
        /* Ignore errors as they're just warnings about splash screen already hidden */
      });
    }
  }, [loaded, isI18nInitialized]);

  if (!loaded) {
    return null;
  }

  // Render a loading screen with the logo until fonts and i18n are loaded
  if (!isI18nInitialized || !loaded) {
    return <CustomSplashScreen />;
  }

  return (
    <AuthProvider>
      <LocalizationProvider>
        <ThemeProvider>
          {(themeContext) => (
            <NavigationThemeProvider value={themeContext.theme === 'dark' ? DarkTheme : DefaultTheme}>
              <RootLayoutNav />
              <StatusBar style={themeContext.theme === 'dark' ? 'light' : 'dark'} />
            </NavigationThemeProvider>
          )}
        </ThemeProvider>
      </LocalizationProvider>
    </AuthProvider>
  );
}
