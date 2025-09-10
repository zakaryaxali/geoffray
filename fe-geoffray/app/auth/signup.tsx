import React from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Colors } from '@/src/constants/Colors';

// Import components
import { EventBanner } from '@/src/components/auth/EventBanner';
import { SignupForm } from '@/src/components/auth/SignupForm';
import { ErrorView } from '@/src/components/auth/ErrorView';
import { ThemedText } from '@/src/components/ThemedText';
import { useSignupData } from '@/src/components/auth/useSignupData';
import { authStyles } from '@/src/components/auth/AuthStyles';

export default function SignupScreen() {
  // Get invite code from URL params if present
  const params = useLocalSearchParams();
  const inviteCode = params.code ? String(params.code) : null;
  
  // Hooks
  const { t } = useTranslation();
  const { theme } = useTheme();
  
  // Get theme colors based on the current theme
  const themeColors = theme === 'dark' ? Colors.dark : Colors.light;

  // Use our custom hook to manage signup data and logic
  const {
    // Form state
    firstName,
    lastName,
    email,
    password,
    phoneNumber,
    countryCode,
    
    // Form validation state
    isValidFirstName,
    isValidLastName,
    isValidEmail,
    isValidPassword,
    isValidPhone,
    
    // UI state
    errorMessage,
    isRegistering,
    loading,
    inviteInfo,
    bannerImage,
    
    // Setters
    setFirstName,
    setLastName,
    setEmail,
    setPassword,
    setPhoneNumber,
    setCountryCode,
    setIsValidFirstName,
    setIsValidLastName,
    setIsValidEmail,
    setIsValidPassword,
    setErrorMessage,
    
    // Actions
    handleRegister,
    handleGoogleSignIn,
    handleAppleSignIn,
    navigateToLogin
  } = useSignupData(inviteCode);

  // Show loading state while validating invitation
  if (loading) {
    return (
      <SafeAreaView style={[authStyles.container, { backgroundColor: themeColors.background }]}>
        <Stack.Screen options={{ title: t('auth.signup') }} />
        <View style={authStyles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <ThemedText style={{ marginTop: 16 }}>{t('common.loading')}</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state for invalid invitations
  if (inviteCode && (errorMessage || !inviteInfo || !inviteInfo.valid)) {
    return (
      <SafeAreaView style={[authStyles.container, { backgroundColor: themeColors.background }]}>
        <Stack.Screen options={{ title: t('auth.signup') }} />
        <ErrorView 
          errorMessage={errorMessage || inviteInfo?.message || t('event.invitationExpiredOrInvalid')}
          themeColors={themeColors}
        />
      </SafeAreaView>
    );
  }

  // Main signup form
  return (
    <SafeAreaView style={[authStyles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <Stack.Screen options={{ 
        title: inviteCode ? t('auth.createAccount') : t('auth.signup'),
        headerStyle: { backgroundColor: themeColors.background },
        headerTintColor: themeColors.text
      }} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={authStyles.keyboardAvoidView}
      >
        <ScrollView style={authStyles.scrollView}>
          <View style={authStyles.content}>
            {/* Event Info Banner (only shown for invitations) */}
            {inviteCode && inviteInfo && (
              <EventBanner 
                inviteInfo={inviteInfo}
                bannerImage={bannerImage}
              />
            )}
            
            {/* Signup Form */}
            <SignupForm
              firstName={firstName}
              lastName={lastName}
              email={email}
              password={password}
              phoneNumber={phoneNumber}
              countryCode={countryCode}
              isValidFirstName={isValidFirstName}
              isValidLastName={isValidLastName}
              isValidEmail={isValidEmail}
              isValidPassword={isValidPassword}
              isValidPhone={isValidPhone}
              errorMessage={errorMessage}
              isRegistering={isRegistering}
              inviteCode={inviteCode}
              inviteInfo={inviteInfo}
              themeColors={themeColors}
              setFirstName={setFirstName}
              setLastName={setLastName}
              setEmail={setEmail}
              setPassword={setPassword}
              setPhoneNumber={setPhoneNumber}
              setCountryCode={setCountryCode}
              setIsValidFirstName={setIsValidFirstName}
              setIsValidLastName={setIsValidLastName}
              setIsValidEmail={setIsValidEmail}
              setIsValidPassword={setIsValidPassword}
              setErrorMessage={setErrorMessage}
              handleRegister={handleRegister}
              handleGoogleSignIn={handleGoogleSignIn}
              handleAppleSignIn={handleAppleSignIn}
              navigateToLogin={navigateToLogin}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
