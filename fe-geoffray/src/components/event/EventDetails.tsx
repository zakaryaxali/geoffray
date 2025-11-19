import React, {useState} from 'react';
import {ScrollView, TouchableOpacity, View, ActivityIndicator, Platform, Linking} from 'react-native';
import {useTranslation} from 'react-i18next';
import {Ionicons} from '@expo/vector-icons';
import {useTheme} from '@/src/contexts/ThemeContext';
import {ThemedText} from '@/src/components/ThemedText';
import {IconSymbol} from '@/src/components/ui/IconSymbol';
import {EventResponse, UpdateEventRequest, PendingInvitation} from '@/src/api/eventApi';
import {Participant} from './useEventData';
import {getInitials} from './EventUtils';
import {eventStyles} from './EventStyles';
import {StatusChangeModal} from './StatusChangeModal';
import {Colors} from '@/src/constants/Colors';
import {useAuth} from '@/src/contexts/AuthContext';
import {EditEventDetails} from './EditEventDetails';
import {EventDateTimeDisplay} from './EventDateTimeDisplay';
import {EventLocationDisplay} from './EventLocationDisplay';
import {PendingInvitations} from './PendingInvitations';

interface EventDetailsProps {
  event: EventResponse;
  participants: Participant[];
  pendingInvitations: PendingInvitation[];
  onInvitePress: () => void;
  onParticipantStatusChanged?: (participantId: string, newStatus: 'going' | 'pending' | 'not_going') => void;
  isCreator: boolean;
  onUpdateEvent?: (updateData: UpdateEventRequest) => Promise<boolean>;
  isEditMode?: boolean;
  onEditComplete?: () => void;
  onRescindInvitation?: (email: string) => void;
  onCopyInviteLink?: (email: string) => Promise<string | null>;
}

export const EventDetails: React.FC<EventDetailsProps> = ({
  event,
  participants,
  pendingInvitations,
  onInvitePress,
  onParticipantStatusChanged,
  isCreator,
  onUpdateEvent,
  isEditMode = false,
  onEditComplete,
  onRescindInvitation,
  onCopyInviteLink
}) => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [currentUserParticipant, setCurrentUserParticipant] = useState<Participant | null>(null);
  // Use external edit mode state if provided, otherwise use local state
  const [localEditMode, setLocalEditMode] = useState(false);
  const editModeActive = isEditMode !== undefined ? isEditMode : localEditMode;
  const [isSaving, setIsSaving] = useState(false);
  const themeColors = theme === 'dark' ? Colors.dark : Colors.light;

  // Find the current user in participants list
  React.useEffect(() => {
    if (user && participants.length > 0) {
      const userParticipant = participants.find(p => p.id === user.id);
      if (userParticipant) {
        setCurrentUserParticipant(userParticipant);
      }
    }
  }, [user, participants]);

  // Handle status change - only for the current user
  const handleStatusChange = (newStatus: 'going' | 'pending' | 'not_going') => {
    if (currentUserParticipant && onParticipantStatusChanged && user && currentUserParticipant.id === user.id) {
      onParticipantStatusChanged(currentUserParticipant.id, newStatus);
    }
  };

  // Function to open Google Maps with the location
  const openMapsWithLocation = (location: string | undefined) => {
    if (!location) return; // Guard clause for undefined location
    const encodedLocation = encodeURIComponent(location);
    let url: string;

    if (Platform.OS === 'ios') {
      // For iOS, try to use Apple Maps first, with Google Maps as a fallback
      url = `maps://maps.apple.com/?q=${encodedLocation}`;
      Linking.canOpenURL(url).then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          // Fallback to Google Maps web URL
          Linking.openURL(`https://maps.google.com/maps?q=${encodedLocation}`);
        }
      }).catch(() => {
        // If there's an error, fallback to Google Maps web URL
        Linking.openURL(`https://maps.google.com/maps?q=${encodedLocation}`);
      });
    } else {
      // For Android and web, use Google Maps
      url = `https://maps.google.com/maps?q=${encodedLocation}`;
      Linking.openURL(url);
    }
  };

  // Generate participant avatar colors based on their ID
  const getAvatarColor = (id: string) => {
    const colors = [
      '#4285F4', '#EA4335', '#FBBC05', '#34A853', 
      '#FF6D01', '#46BDC6', '#7E57C2', '#EC407A'
    ];
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Handle event update
  const handleUpdateEvent = async (updateData: UpdateEventRequest): Promise<boolean> => {
    if (!onUpdateEvent) return false;
    
    setIsSaving(true);
    try {
      const success = await onUpdateEvent(updateData);
      if (success) {
        // Update local edit mode state if we're using it
        if (isEditMode === undefined) {
          setLocalEditMode(false);
        }
        // Call the external callback if provided
        if (onEditComplete) {
          onEditComplete();
        }
      }
      return success;
    } catch (error) {
      console.error('Error updating event:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // If in edit mode, show the edit form
  if (editModeActive) {
    return (
      <EditEventDetails 
        event={event} 
        onSave={handleUpdateEvent}
        onCancel={() => {
          // Update local edit mode state if we're using it
          if (isEditMode === undefined) {
            setLocalEditMode(false);
          }
          // Call the external callback if provided
          if (onEditComplete) {
            onEditComplete();
          }
        }}
      />
    );
  }

  return (
    <ScrollView 
      style={eventStyles.contentContainer}
      contentContainerStyle={eventStyles.scrollContent}
    >
      {/* Date and Time */}
      <EventDateTimeDisplay 
        startDate={event.start_date}
        endDate={event.end_date}
        themeColors={themeColors}
      />

      {/* Location */}
      {event.location && (
        <EventLocationDisplay 
          location={event.location}
          themeColors={themeColors}
        />
      )}

      {/* Description */}
      {event.description && (
        <>
          <ThemedText style={[eventStyles.sectionTitle, { color: themeColors.text, marginTop: 16 }]}>
            {t('event.description')}
          </ThemedText>
          <ThemedText style={[eventStyles.detailText, { color: themeColors.text, marginBottom: 16 }]}>
            {event.description}
          </ThemedText>
        </>
      )}

      {/* Participants */}
      <View style={eventStyles.participantsContainer}>
        <ThemedText style={[eventStyles.sectionTitle, { color: themeColors.text }]}>
          {t('event.participants')} ({participants.length})
        </ThemedText>
        <View style={eventStyles.participantsList}>
          {participants.map((participant) => (
            <View key={participant.id} style={eventStyles.participantItem}>
              <View 
                style={[
                  eventStyles.participantAvatar, 
                  { backgroundColor: getAvatarColor(participant.id) }
                ]}
              >
                <ThemedText style={eventStyles.participantInitials}>
                  {getInitials(participant.name)}
                </ThemedText>
              </View>
              <ThemedText style={[eventStyles.participantName, { color: themeColors.text }]}>
                {participant.name}
                {user && participant.id === event.creator_id && (
                  <ThemedText style={[eventStyles.participantName, { color: themeColors.primary, fontStyle: 'italic' }]}> ({t('common.creator')})</ThemedText>
                )}
                {user && participant.id === user.id && (
                  <ThemedText style={[eventStyles.participantName, { color: themeColors.primary, fontStyle: 'italic' }]}> ({t('common.you')})</ThemedText>
                )}
              </ThemedText>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={[
                    eventStyles.participantStatus,
                    {
                      backgroundColor:
                        participant.status === 'going'
                          ? 'rgba(52, 168, 83, 0.15)'
                          : participant.status === 'not_going'
                            ? 'rgba(234, 67, 53, 0.15)'
                            : 'rgba(251, 188, 5, 0.15)',
                      borderWidth: 1,
                      borderColor:
                        participant.status === 'going'
                          ? 'rgba(52, 168, 83, 0.3)'
                          : participant.status === 'not_going'
                            ? 'rgba(234, 67, 53, 0.3)'
                            : 'rgba(251, 188, 5, 0.3)'
                    }
                  ]}
                >
                  <ThemedText
                    style={{
                      color:
                        participant.status === 'going'
                          ? '#34A853'
                          : participant.status === 'not_going'
                            ? '#EA4335'
                            : '#FBBC05',
                      fontWeight: '600',
                      fontSize: 12
                    }}
                  >
                    {participant.status === 'going'
                      ? t('event.going')
                      : participant.status === 'not_going'
                        ? t('event.notGoing')
                        : t('event.pending')}
                  </ThemedText>
                </View>

                {/* Change status button (only for current user who is a participant) */}
                {user && participant.id === user.id && (
                  <TouchableOpacity
                    style={[eventStyles.changeStatusButton, { borderColor: themeColors.border }]}
                    onPress={() => {
                      setCurrentUserParticipant(participant);
                      setStatusModalVisible(true);
                    }}
                  >
                    <Ionicons name="create-outline" size={16} color={themeColors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
        
        {/* Status Change Modal */}
        {currentUserParticipant && (
          <StatusChangeModal
            visible={statusModalVisible}
            onClose={() => setStatusModalVisible(false)}
            eventId={event.id}
            currentStatus={currentUserParticipant.status}
            onStatusChanged={handleStatusChange}
          />
        )}
      </View>

      {/* Pending Invitations - Only show to creator */}
      {isCreator && <PendingInvitations invitations={pendingInvitations} onRescind={onRescindInvitation} onCopyInviteLink={onCopyInviteLink} />}

      {/* Participants Container End - Invite Button - Only show to creator */}
      {isCreator && (
        <View style={eventStyles.participantsContainer}>
          {/* Invite Button */}
          <TouchableOpacity
            style={[
              eventStyles.inviteButton,
              { backgroundColor: themeColors.primary }
            ]}
            onPress={onInvitePress}
          >
            <IconSymbol name="person.badge.plus" size={20} color="#FFFFFF" />
            <ThemedText style={[eventStyles.inviteButtonText, { color: '#FFFFFF' }]}>
              {t('event.inviteParticipant')}
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};
