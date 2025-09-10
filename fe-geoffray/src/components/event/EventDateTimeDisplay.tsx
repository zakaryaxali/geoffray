import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { IconSymbol } from '@/src/components/ui/IconSymbol';
import { ThemedText } from '@/src/components/ThemedText';
import { formatDate, formatTime } from './EventUtils';
import { eventStyles } from './EventStyles';

interface EventDateTimeDisplayProps {
  startDate: string;
  endDate?: string;
  themeColors: {
    primary: string;
    text: string;
  };
}

export const EventDateTimeDisplay: React.FC<EventDateTimeDisplayProps> = ({
  startDate,
  endDate,
  themeColors,
}) => {
  const { t, i18n } = useTranslation();

  return (
    <>
      <ThemedText style={[eventStyles.sectionTitle, { color: themeColors.text }]}>
        {t('event.dateAndTime')}
      </ThemedText>
      
      {/* Start date with time */}
      <View style={eventStyles.detailRow}>
        <IconSymbol 
          name="calendar" 
          size={24} 
          color={themeColors.primary} 
          style={eventStyles.detailIcon} 
        />
        <ThemedText style={[eventStyles.detailText, { color: themeColors.text }]}>
          {formatDate(startDate, i18n.language)} {formatTime(startDate, i18n.language)}
        </ThemedText>
      </View>
      
      {/* End date with time (if available) */}
      {endDate && (
        <View style={eventStyles.detailRow}>
          <IconSymbol 
            name="calendar" 
            size={24} 
            color={themeColors.primary} 
            style={eventStyles.detailIcon} 
          />
          <ThemedText style={[eventStyles.detailText, { color: themeColors.text }]}>
            {formatDate(endDate, i18n.language)} {formatTime(endDate, i18n.language)}
          </ThemedText>
        </View>
      )}
    </>
  );
};
