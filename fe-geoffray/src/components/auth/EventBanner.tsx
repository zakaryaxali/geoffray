import React from 'react';
import { View, Image } from 'react-native';
import { ThemedText } from '@/src/components/ThemedText';
import { useTranslation } from 'react-i18next';
import { authStyles } from './AuthStyles';
import { InviteValidationResponse } from '@/src/api/eventApi';

interface EventBannerProps {
  inviteInfo: InviteValidationResponse;
  bannerImage: string;
}

export const EventBanner = ({ inviteInfo, bannerImage }: EventBannerProps) => {
  const { t } = useTranslation();

  return (
    <View style={authStyles.eventBanner}>
      <Image 
        source={{ uri: bannerImage }} 
        style={authStyles.bannerImage}
      />
      <View style={authStyles.eventInfoOverlay}>
        <ThemedText style={authStyles.eventTitle}>
          {inviteInfo.eventTitle || t('event.eventInvitation')}
        </ThemedText>
        <ThemedText style={authStyles.inviteText}>
          {t('event.signupToJoinEvent')}
        </ThemedText>
      </View>
    </View>
  );
};
