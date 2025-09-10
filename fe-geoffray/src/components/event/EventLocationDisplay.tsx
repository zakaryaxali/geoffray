import React from 'react';
import { View, TouchableOpacity, Linking, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { IconSymbol } from '@/src/components/ui/IconSymbol';
import { ThemedText } from '@/src/components/ThemedText';
import { eventStyles } from './EventStyles';

interface EventLocationDisplayProps {
  location: string;
  themeColors: {
    primary: string;
    text: string;
  };
}

export const EventLocationDisplay: React.FC<EventLocationDisplayProps> = ({
  location,
  themeColors,
}) => {
  const { t } = useTranslation();

  const handleLocationPress = () => {
    const mapsUrl = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(location)}`,
      android: `geo:0,0?q=${encodeURIComponent(location)}`,
      default: `https://maps.google.com/?q=${encodeURIComponent(location)}`,
    });
    
    Linking.canOpenURL(mapsUrl).then((supported) => {
      if (supported) {
        Linking.openURL(mapsUrl);
      } else {
        console.log("Don't know how to open URI: " + mapsUrl);
      }
    });
  };

  if (!location) return null;

  return (
    <>
      <ThemedText style={[eventStyles.sectionTitle, { color: themeColors.text, marginTop: 16 }]}>
        {t('event.location')}
      </ThemedText>
      <TouchableOpacity onPress={handleLocationPress}>
        <View style={eventStyles.detailRow}>
          <IconSymbol 
            name="mappin" 
            size={24} 
            color={themeColors.primary} 
            style={eventStyles.detailIcon} 
          />
          <ThemedText 
            style={[
              eventStyles.detailText, 
              { color: themeColors.primary, textDecorationLine: 'underline' }
            ]}
          >
            {location}
          </ThemedText>
        </View>
      </TouchableOpacity>
    </>
  );
};
