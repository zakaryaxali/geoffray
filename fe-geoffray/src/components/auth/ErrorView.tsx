import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/src/components/ThemedText';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { authStyles } from './AuthStyles';

interface ErrorViewProps {
  errorMessage: string;
  themeColors: any;
}

export const ErrorView = ({ errorMessage, themeColors }: ErrorViewProps) => {
  const { t } = useTranslation();

  return (
    <View style={authStyles.errorContainer}>
      <View style={[authStyles.iconContainer, { backgroundColor: themeColors.error }]}>
        <Ionicons name="warning-outline" size={40} color="white" />
      </View>
      <ThemedText style={[authStyles.errorTitle, { color: themeColors.text }]}>
        {t('event.invalidInvitation')}
      </ThemedText>
      <ThemedText style={[authStyles.errorText, { color: themeColors.textSecondary }]}>
        {errorMessage || t('event.invitationExpiredOrInvalid')}
      </ThemedText>
      <TouchableOpacity 
        style={[authStyles.button, { backgroundColor: themeColors.primary }]} 
        onPress={() => router.replace('/auth/signup')}
      >
        <ThemedText style={authStyles.buttonText}>{t('auth.regularSignup')}</ThemedText>
      </TouchableOpacity>
    </View>
  );
};
