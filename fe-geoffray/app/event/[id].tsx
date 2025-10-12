import React, { useState, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity } from 'react-native';

import { ThemedText } from '@/src/components/ThemedText';
import { Colors } from '@/src/constants/Colors';
import { useTheme } from '@/src/contexts/ThemeContext';

// Import components
import { EventBanner } from '@/src/components/event/EventBanner';
import { EventTabs, TabType } from '@/src/components/event/EventTabs';
import { EventDetails } from '@/src/components/event/EventDetails';
import { EventDiscussion } from '@/src/components/event/EventDiscussion';
import { EventGifts } from '@/src/components/event/EventGifts';
import { InviteParticipantModal } from '@/src/components/event/InviteParticipantModal';
import { useEventData } from '@/src/components/event/useEventData';
import { eventStyles } from '@/src/components/event/EventStyles';
import { ParticipantInviteRequest } from '@/src/api/eventApi';


export default function EventScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [modalVisible, setModalVisible] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  // Use our custom hook to fetch event data
  const { 
    event, 
    participants, 
    loading, 
    error, 
    inviteParticipant,
    updateParticipantStatus,
    isCreator,
    updateEvent
  } = useEventData(id);

  // Get theme colors based on the current theme
  const themeColors = theme === 'dark' ? Colors.dark : Colors.light;
  
  // Handle participant invitation
  const handleInvite = async (type: 'email' | 'phone', identifier: string) => {
    const request: ParticipantInviteRequest = {
      identifier,
      type
    };
    return await inviteParticipant(request);
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={eventStyles.loadingContainer}>
        <Stack.Screen options={{ title: t('event.eventDetails') }} />
        <ActivityIndicator size="large" color={themeColors.primary} />
        <ThemedText style={{ marginTop: 16 }}>{t('common.loading')}</ThemedText>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <SafeAreaView style={eventStyles.errorContainer}>
        <Stack.Screen options={{ title: t('event.eventDetails') }} />
        <ThemedText style={[eventStyles.errorText, { color: themeColors.text }]}>
          {error || t('event.notFound')}
        </ThemedText>
        <TouchableOpacity 
          style={[eventStyles.backButton, { backgroundColor: themeColors.primary }]} 
          onPress={() => router.navigate('/')}
        >
          <ThemedText style={eventStyles.backButtonText}>{t('common.goBack')}</ThemedText>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  
  // Main content
  return (
    <SafeAreaView style={[eventStyles.container, { backgroundColor: themeColors.background }]} edges={['top', 'bottom', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Banner with event image - hidden when scrolling in discussion */}
      {(activeTab === 'details' || showBanner) && (
        <EventBanner 
          title={event!.title} 
          bannerUrl={event!.banner}
          persona={event!.giftee_persona}
          occasion={event!.event_occasion}
          isCreator={isCreator}
          onEditPress={() => {
            setActiveTab('details'); // Switch to details tab if not already there
            setIsEditing(true); // Set editing mode to true
          }}
        />
      )}
      
      {/* Tabs */}
      <EventTabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Tab content */}
      <View style={eventStyles.contentContainer}>
        {activeTab === 'details' && (
          <EventDetails 
            event={event!} 
            participants={participants} 
            onInvitePress={() => setModalVisible(true)}
            onParticipantStatusChanged={(participantId, newStatus) => {
              updateParticipantStatus(participantId, newStatus);
            }}
            isCreator={isCreator}
            onUpdateEvent={updateEvent}
            isEditMode={isEditing}
            onEditComplete={() => setIsEditing(false)}
          />
        )}
        
        {activeTab === 'gifts' && (
          <EventGifts 
            eventId={typeof id === 'string' ? id : String(id)}
            isCreator={isCreator}
          />
        )}
        
        {activeTab === 'discussion' && (
          <EventDiscussion 
            eventId={typeof id === 'object' ? String(id) : id}
            onScroll={(offsetY: number) => {
              // Hide banner when scrolling down, show when at the top
              setShowBanner(offsetY <= 10);
            }}
          />
        )}
      </View>
      
      {/* Invite Participant Modal */}
      <InviteParticipantModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        onInvite={handleInvite} 
      />
    </SafeAreaView>
  );
}
