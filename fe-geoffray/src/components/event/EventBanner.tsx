import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Share } from 'react-native';

import { ThemedText } from '@/src/components/ThemedText';
import { IconSymbol } from '@/src/components/ui/IconSymbol';
import { getRandomBanner } from './EventUtils';
import { eventStyles } from './EventStyles';

interface EventBannerProps {
  title: string;
  bannerUrl?: string;
  isCreator?: boolean;
  onEditPress?: () => void;
}

export const EventBanner: React.FC<EventBannerProps> = ({ title, bannerUrl, isCreator, onEditPress }) => {
  const router = useRouter();

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this event: ${title}`,
      });
    } catch (error) {
      console.error('Error sharing event:', error);
    }
  };

  return (
    <View style={eventStyles.bannerContainer}>
      <Image 
        source={{ uri: bannerUrl || getRandomBanner() }} 
        style={eventStyles.bannerImage}
      />
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
          <TouchableOpacity 
            style={eventStyles.shareButton}
            onPress={handleShare}
          >
            <IconSymbol name="square.and.arrow.up" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      <ThemedText style={eventStyles.eventTitle}>{title}</ThemedText>
    </View>
  );
};
