import React, {useEffect, useState} from 'react';
import {ActivityIndicator, SectionList, SafeAreaView, StatusBar, StyleSheet, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useRouter} from 'expo-router';

import {ThemedText} from '@/src/components/ThemedText';
import {ThemedView} from '@/src/components/ThemedView';
import {Event, EventCard} from '@/src/components/EventCard';
import {eventApi, EventResponse} from '@/src/api/eventApi';


// Convert API event format to component event format
const mapApiEventToComponentEvent = (apiEvent: EventResponse): Event => {
  return {
    id: apiEvent.id,
    name: apiEvent.title,
    startDate: apiEvent.start_date,
    endDate: apiEvent.end_date,
    isActive: apiEvent.active,
    participantsCount: apiEvent.participants_count || 0,
    persona: apiEvent.giftee_persona,
    occasion: apiEvent.event_occasion,
    customBanner: apiEvent.banner,
    location: apiEvent.location,
  };
};

// Section data structure for SectionList
interface EventSection {
  title: string;
  data: Event[];
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [sections, setSections] = useState<EventSection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to organize events into sections
  const organizeSections = (allEvents: Event[]): EventSection[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

    // Filter incoming events (today or future based on endDate if available, else startDate)
    const incomingEvents = allEvents.filter(event => {
      const relevantDate = event.endDate ? new Date(event.endDate) : new Date(event.startDate);
      return relevantDate >= today;
    });

    // Sort incoming events ascending (soonest first)
    incomingEvents.sort((a, b) =>
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    // Filter past events (before today based on endDate if available, else startDate)
    const pastEvents = allEvents.filter(event => {
      const relevantDate = event.endDate ? new Date(event.endDate) : new Date(event.startDate);
      return relevantDate < today;
    });

    // Sort past events descending (most recent first)
    pastEvents.sort((a, b) =>
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );

    // Build sections array
    const newSections: EventSection[] = [];

    // Always add Incoming section
    newSections.push({
      title: 'Incoming',
      data: incomingEvents,
    });

    // Only add Past Events section if there are past events
    if (pastEvents.length > 0) {
      newSections.push({
        title: 'Past Events',
        data: pastEvents,
      });
    }

    return newSections;
  };

  // Fetch events from the backend API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const apiEvents = await eventApi.getUserEvents();

        // Convert API events to the format expected by the EventCard component
        const formattedEvents = apiEvents.map(mapApiEventToComponentEvent);

        setEvents(formattedEvents);
        setSections(organizeSections(formattedEvents));
        setError(null);
      } catch (error) {
        console.error('Error fetching events:', error);
        setError('Failed to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && events.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>{t('common.loading')}</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (error && events.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  // Determine if there are any past events to show the appropriate empty state
  const hasPastEvents = sections.some(section => section.title === 'Past Events');
  const hasIncomingEvents = sections.length > 0 && sections[0].data.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EventCard event={item} />}
        renderSectionHeader={({ section: { title, data } }) => (
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
          </View>
        )}
        renderSectionFooter={({ section: { title, data } }) => {
          // Show empty state only for Incoming section when it's empty
          if (title === 'Incoming' && data.length === 0) {
            // If there are past events, show simple message. Otherwise show button
            if (hasPastEvents) {
              return (
                <View style={styles.emptyIncomingContainer}>
                  <ThemedText style={styles.emptyText}>
                    {t('home.noIncomingEvents')}
                  </ThemedText>
                </View>
              );
            } else {
              return (
                <View style={styles.emptyIncomingContainer}>
                  <TouchableOpacity
                    style={styles.giftSearchButtonCentered}
                    onPress={() => {
                      router.push('/create-event-with-gifts');
                    }}
                  >
                    <ThemedText style={styles.giftSearchTextCentered}>
                      {t('home.giftSearch')}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              );
            }
          }
          return null;
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={() => {
          setLoading(true);
          eventApi.getUserEvents()
            .then(apiEvents => {
              const formattedEvents = apiEvents.map(mapApiEventToComponentEvent);
              setEvents(formattedEvents);
              setSections(organizeSections(formattedEvents));
            })
            .catch(err => {
              console.error('Error refreshing events:', err);
            })
            .finally(() => setLoading(false));
        }}
      />

      {/* Gift Search FAB - always visible */}
      <TouchableOpacity
        style={styles.giftSearchFab}
        onPress={() => {
          router.push('/create-event-with-gifts');
        }}
      >
        <ThemedText style={styles.giftSearchFabText}>+</ThemedText>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  listContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 12,
  },
  sectionHeader: {
    paddingVertical: 12,
    paddingTop: 20,
    paddingLeft: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  emptyIncomingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.6,
  },
  giftSearchButtonCentered: {
    backgroundColor: '#FFA726',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 200,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  giftSearchTextCentered: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  giftSearchFab: {
    position: 'absolute',
    bottom: 40,
    right: 24,
    backgroundColor: '#FFA726',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  giftSearchFabText: {
    fontSize: 28,
    fontWeight: '400',
    color: '#FFFFFF',
  },
});
