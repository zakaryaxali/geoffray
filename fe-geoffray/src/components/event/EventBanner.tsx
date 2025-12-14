import React from 'react';
import { View, Image, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/src/components/ThemedText';
import { IconSymbol } from '@/src/components/ui/IconSymbol';
import { useEventBackground } from '@/src/hooks/useEventBackground';
import { eventStyles } from './EventStyles';

interface EventBannerProps {
  title: string;
  bannerUrl?: string;
  persona?: string;
  occasion?: string;
  isCreator?: boolean;
  onEditPress?: () => void;
  onDeletePress?: () => void;
}

export const EventBanner: React.FC<EventBannerProps> = ({ title, bannerUrl, persona, occasion, isCreator, onEditPress, onDeletePress }) => {
  const router = useRouter();
  const { t } = useTranslation();
  const { backgroundSource, isComponent } = useEventBackground({
    persona,
    occasion,
    customBanner: bannerUrl
  });

  const handleDeletePress = () => {
    // For web, use window.confirm as Alert.alert doesn't work well on web
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(t('event.confirmDelete'));
      if (confirmed && onDeletePress) {
        onDeletePress();
      }
    } else {
      // For native platforms, use Alert.alert
      Alert.alert(
        t('event.confirmDelete'),
        '',
        [
          {
            text: t('common.cancel'),
            style: 'cancel',
          },
          {
            text: t('common.delete'),
            style: 'destructive',
            onPress: () => {
              if (onDeletePress) {
                onDeletePress();
              }
            },
          },
        ],
        { cancelable: true }
      );
    }
  };

  // Render banner image (WebP or URL)
  const renderBanner = () => {
    return (
      <Image
        source={typeof backgroundSource === 'string' ? { uri: backgroundSource } : backgroundSource}
        style={eventStyles.bannerImage}
        resizeMode="cover"
      />
    );
  };

  return (
    <View style={eventStyles.bannerContainer}>
      {renderBanner()}
      <View style={eventStyles.bannerOverlay}>
        <TouchableOpacity
          style={eventStyles.backButton}
          onPress={() => router.replace('/home')}
        >
          <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row' }}>
          {isCreator && onEditPress && (
            <TouchableOpacity
              style={[eventStyles.shareButton, { marginRight: 8 }]}
              onPress={onEditPress}
            >
              <IconSymbol name="pencil" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          {isCreator && onDeletePress && (
            <TouchableOpacity
              style={eventStyles.shareButton}
              onPress={handleDeletePress}
            >
              <IconSymbol name="trash.fill" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <ThemedText style={eventStyles.eventTitle}>{title}</ThemedText>
    </View>
  );
};
