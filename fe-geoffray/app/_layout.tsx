import {DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider} from '@react-navigation/native';
import {useFonts} from 'expo-font';
import {Stack, useRouter, useSegments} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {StatusBar} from 'expo-status-bar';
import {useEffect, useState} from 'react';
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
  const { user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === 'auth';
    const inInviteGroup = segments[0] === 'invite';
    const isPrivacyPolicy = segments[0] === 'privacy-policy';
    
    if (!user && !inAuthGroup && !inInviteGroup && !isPrivacyPolicy) {
      // Redirect to the login page if not signed in and not in allowed public routes
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      // Redirect to the main app if signed in
      router.replace('/home');
    }
  }, [user, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="event/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="invite/[code]" options={{ headerShown: true }} />
      <Stack.Screen name="create-event" options={{ headerShown: false }} />
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
