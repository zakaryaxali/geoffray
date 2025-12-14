import React from 'react';
import {Image, Pressable, StyleSheet, View} from 'react-native';
import {useRouter} from 'expo-router';
import {useTranslation} from 'react-i18next';
import {useLocalization} from '@/src/localization/LocalizationContext';

import {ThemedText} from './ThemedText';
import {IconSymbol} from '@/src/components/ui/IconSymbol';
import {Colors} from '@/src/constants/Colors';
import {useTheme} from '@/src/contexts/ThemeContext';
import {useEventBackground} from '@/src/hooks/useEventBackground';

export type Participant = {
  id: string;
  name: string;
  photoUrl?: string;
};

export type Event = {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  participantsCount: number;
  participants?: Participant[];
  backgroundImage?: any;
  persona?: string;
  occasion?: string;
  customBanner?: string;
  location?: string;
};

interface EventCardProps {
  event: Event;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const router = useRouter();
  const { theme } = useTheme();
  const themeColors = theme === 'dark' ? Colors.dark : Colors.light;
  const { t } = useTranslation();
  const { language } = useLocalization();
  const { backgroundSource, isComponent } = useEventBackground({ 
    persona: event.persona, 
    occasion: event.occasion, 
    customBanner: event.customBanner 
  });

  // Constants for text truncation
  const EVENT_NAME_MAX_LENGTH = 40;
  const EVENT_LOCATION_MAX_LENGTH = 35;

  // Helper function to truncate text with ellipsis
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handlePress = () => {
    // Navigate to the event details page
    router.push(`/event/${event.id}`);
  };

  // Format the date or date range
  const formatDateRange = () => {
    const startDate = new Date(event.startDate);
    // Use the current language for date formatting
    const locale = language === 'fr' ? 'fr-FR' : 'en-US';
    
    const formattedStart = startDate.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    if (event.endDate) {
      const endDate = new Date(event.endDate);
      const formattedEnd = endDate.toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return `${formattedStart} - ${formattedEnd}`;
    }

    return formattedStart;
  };

  // Generate initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      onPress={handlePress}
    >
      <Image
        source={typeof backgroundSource === 'string' ? { uri: backgroundSource } : backgroundSource}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <View style={styles.overlay}>
        <View style={styles.contentContainer}>
          <ThemedText type="subtitle" style={styles.name} numberOfLines={2} ellipsizeMode="tail">
            {truncateText(event.name, EVENT_NAME_MAX_LENGTH)}
          </ThemedText>
          <ThemedText style={styles.date}>{formatDateRange()}</ThemedText>
          {event.location && (
            <ThemedText style={styles.location} numberOfLines={1} ellipsizeMode="tail">
              <IconSymbol name="mappin" size={14} color="white" /> {truncateText(event.location, EVENT_LOCATION_MAX_LENGTH)}
            </ThemedText>
          )}
          <ThemedText style={styles.participants}>
            {event.participantsCount} {event.participantsCount === 1 
              ? t('event.participant') 
              : t('event.participants')}
          </ThemedText>
          
          {/* Only show participant avatars if we have actual participant data */}
          {event.participants && event.participants.length > 0 ? (
            <View style={styles.participantsContainer}>
              {event.participants.slice(0, 3).map((participant, index) => (
                <View 
                  key={participant.id} 
                  style={[
                    styles.participantAvatar, 
                    { zIndex: event.participants ? event.participants.length - index : 3 - index },
                    { marginLeft: index > 0 ? -15 : 0 },
                    { backgroundColor: themeColors.tint }
                  ]}
                >
                  {participant.photoUrl ? (
                    <Image source={{ uri: participant.photoUrl }} style={styles.avatarImage} />
                  ) : (
                    <ThemedText style={styles.initials}>{getInitials(participant.name)}</ThemedText>
                  )}
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 180,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 20, // Increased from 16 to 20 for more internal padding
    justifyContent: 'flex-end',
  },
  contentContainer: {
    gap: 4,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  date: {
    fontSize: 16,
    color: 'white',
  },
  location: {
    fontSize: 14,
    color: 'white',
    marginTop: 2,
  },
  participants: {
    fontSize: 14,
    color: 'white',
    marginBottom: 4,
  },
  participantsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  participantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  initials: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
