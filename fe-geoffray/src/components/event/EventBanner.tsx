import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Share } from 'react-native';

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
}

export const EventBanner: React.FC<EventBannerProps> = ({ title, bannerUrl, persona, occasion, isCreator, onEditPress }) => {
  const router = useRouter();
  const { backgroundSource, isComponent } = useEventBackground({ 
    persona, 
    occasion, 
    customBanner: bannerUrl 
  });

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this event: ${title}`,
      });
    } catch (error) {
      console.error('Error sharing event:', error);
    }
  };

  // Render the appropriate component based on source type
  const renderBanner = () => {
    if (isComponent) {
      // For SVG components
      const SvgComponent = backgroundSource;
      return (
        <View style={eventStyles.bannerImage}>
          <SvgComponent width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
        </View>
      );
    } else {
      // For URL strings
      return (
        <Image 
          source={{ uri: backgroundSource }} 
          style={eventStyles.bannerImage}
        />
      );
    }
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
