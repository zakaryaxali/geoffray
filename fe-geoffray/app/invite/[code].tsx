import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/src/components/ThemedText';
import { IconSymbol } from '@/src/components/ui/IconSymbol';
import { eventApi, InviteValidationResponse } from '@/src/api/eventApi';
import { Colors, BrandColors } from '@/src/constants/Colors';
import { useTheme } from '@/src/contexts/ThemeContext';

// Array of random event banner images (reusing from event page)
const randomEventBanners = [
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80',
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80',
  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80',
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80',
];

// Function to get a random banner image
const getRandomBanner = () => {
  const randomIndex = Math.floor(Math.random() * randomEventBanners.length);
  return randomEventBanners[randomIndex];
};

export default function InvitePage() {
  const { code } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<InviteValidationResponse | null>(null);
  const [error, setError] = useState('');
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  
  // Check if the user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        setIsUserAuthenticated(!!token);
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsUserAuthenticated(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Get theme colors based on the current theme
  const themeColors = theme === 'dark' ? Colors.dark : Colors.light;
  
  useEffect(() => {
    // Validate the invitation code
    const validateInvite = async () => {
      try {
        setLoading(true);
        setError('');
        
        if (!code) {
          setError('Invalid invitation code');
          return;
        }
        
        // Convert code to string if it's not already
        const inviteCode = typeof code === 'object' ? String(code) : code;
        
        // Validate the invitation
        const response = await eventApi.validateInvite(inviteCode);
        setInviteInfo(response);
        
        if (!response.valid) {
          setError(response.message || 'Invalid invitation');
        }
        
        // Store the invite code in AsyncStorage for later use if needed
        await AsyncStorage.setItem('lastInviteCode', inviteCode);
      } catch (error) {
        console.error('Error validating invitation:', error);
        setError('Failed to validate invitation');
        setInviteInfo(null);
      } finally {
        setLoading(false);
      }
    };
    
    validateInvite();
  }, [code]);
  
  // Handle accepting the invitation
  const handleAcceptInvite = async () => {
    try {
      setAccepting(true);
      
      if (!code) {
        Alert.alert(t('common.error'), t('event.invalidInviteCode'));
        return;
      }
      
      // Convert code to string if it's not already
      const inviteCode = typeof code === 'object' ? String(code) : code;
      
      // Accept the invitation
      const response = await eventApi.acceptInvite(inviteCode);
      
      if (response.success && response.eventId) {
        // Navigate to the event page
        router.replace(`/event/${response.eventId}`);
      } else {
        Alert.alert(t('common.error'), response.message || t('event.failedToJoinEvent'));
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      Alert.alert(t('common.error'), t('event.failedToJoinEvent'));
    } finally {
      setAccepting(false);
    }
  };
  
  // Redirect to login if not authenticated
  const handleLogin = () => {
    // Store the invite code in AsyncStorage for retrieval after login
    if (code) {
      const inviteCode = typeof code === 'object' ? String(code) : code;
      AsyncStorage.setItem('pendingInviteCode', inviteCode);
    }
    
    // Navigate to login page
    router.replace('/auth/login');
  };
  
  // Redirect to unified signup if not authenticated
  const handleSignup = () => {
    // Navigate to unified signup page with the code
    if (code) {
      const inviteCode = typeof code === 'object' ? String(code) : code;
      router.replace(`/auth/signup?code=${inviteCode}`);
    } else {
      // Fallback to regular signup if no code
      router.replace('/auth/signup');
    }
  };
  
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <Stack.Screen options={{ title: t('event.invitation') }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <ThemedText style={{ marginTop: 16 }}>{t('common.loading')}</ThemedText>
        </View>
      </SafeAreaView>
    );
  }
  
  if (error || !inviteInfo || !inviteInfo.valid) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <Stack.Screen options={{ title: t('event.invitation') }} />
        <View style={styles.errorContainer}>
          <View style={[styles.iconContainer, { backgroundColor: themeColors.error }]}>
            <IconSymbol name="exclamationmark.triangle" size={40} color="white" />
          </View>
          <ThemedText style={[styles.errorTitle, { color: themeColors.text }]}>
            {t('event.invalidInvitation')}
          </ThemedText>
          <ThemedText style={[styles.errorText, { color: themeColors.textSecondary }]}>
            {error || inviteInfo?.message || t('event.invitationExpiredOrInvalid')}
          </ThemedText>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: BrandColors.coral }]} 
            onPress={() => router.replace('/home')}
          >
            <ThemedText style={styles.buttonText}>{t('common.goToHome')}</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Stack.Screen options={{ title: t('event.invitation') }} />
      
      <View style={styles.content}>
        <Image 
          source={{ uri: getRandomBanner() }} 
          style={styles.bannerImage}
        />
        
        <View style={styles.infoContainer}>
          <ThemedText style={[styles.title, { color: themeColors.text }]}>
            {inviteInfo.eventTitle || t('event.eventInvitation')}
          </ThemedText>
          
          <ThemedText style={[styles.description, { color: themeColors.textSecondary }]}>
            {t('event.youHaveBeenInvited')}
          </ThemedText>
          
          {isUserAuthenticated ? (
            <TouchableOpacity 
              style={[
                styles.button, 
                { backgroundColor: themeColors.primary },
                accepting && { opacity: 0.7 }
              ]} 
              onPress={handleAcceptInvite}
              disabled={accepting}
            >
              {accepting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <ThemedText style={styles.buttonText}>{t('event.joinEvent')}</ThemedText>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.authButtonsContainer}>
              <ThemedText style={[styles.authMessage, { color: themeColors.textSecondary }]}>
                {t('event.loginOrSignupToJoin')}
              </ThemedText>
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: BrandColors.coral }]} 
                onPress={handleSignup}
              >
                <ThemedText style={styles.buttonText}>{t('auth.createAccountAndJoin')}</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.outlineButton, { borderColor: BrandColors.peach }]} 
                onPress={handleLogin}
              >
                <ThemedText style={[styles.outlineButtonText, { color: BrandColors.peach }]}>
                  {t('auth.alreadyHaveAccount')}
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  content: {
    flex: 1,
  },
  bannerImage: {
    width: '100%',
    height: 200,
  },
  infoContainer: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  authButtonsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  authMessage: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  outlineButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 12,
  },
  outlineButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
