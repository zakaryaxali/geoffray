import React, {useEffect, useState} from 'react';
import {ActivityIndicator, FlatList, SafeAreaView, StatusBar, StyleSheet, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useRouter} from 'expo-router';

import {ThemedText} from '@/src/components/ThemedText';
import {ThemedView} from '@/src/components/ThemedView';
import {Event, EventCard} from '@/src/components/EventCard';
import {EventsFilter, FilterType} from '@/src/components/EventsFilter';
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

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('next');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch events from the backend API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const apiEvents = await eventApi.getUserEvents();
        
        // Convert API events to the format expected by the EventCard component
        const formattedEvents = apiEvents.map(mapApiEventToComponentEvent);
        
        setEvents(formattedEvents);
        
        // Apply initial filtering based on date
        const currentDate = new Date();
        const upcomingEvents = formattedEvents.filter(event => new Date(event.startDate) >= currentDate);
        const sortedEvents = upcomingEvents.sort((a, b) => 
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
        setFilteredEvents(sortedEvents);
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

  // Filter and sort events based on date
  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    const currentDate = new Date();
    
    if (filter === 'next') {
      // Filter for upcoming events (start date is in the future)
      const upcomingEvents = events.filter(event => new Date(event.startDate) >= currentDate);
      // Sort by start date (closest first)
      const sortedEvents = upcomingEvents.sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
      setFilteredEvents(sortedEvents);
    } else { // 'past'
      // Filter for past events (start date is in the past)
      const pastEvents = events.filter(event => new Date(event.startDate) < currentDate);
      // Sort by start date (most recent first)
      const sortedEvents = pastEvents.sort((a, b) => 
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );
      setFilteredEvents(sortedEvents);
    }
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <EventsFilter 
        activeFilter={activeFilter} 
        onFilterChange={handleFilterChange} 
      />
      
      {filteredEvents.length === 0 ? (
        <View style={styles.emptyContainer}>
          {/* Gift Search Button - centered when no events */}
          {activeFilter === 'next' ? (
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
          ) : (
            <ThemedText style={styles.emptyText}>
              {t('home.noPastEvents')}
            </ThemedText>
          )}
        </View>
      ) : (
        <>
          <FlatList
            data={filteredEvents}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <EventCard event={item} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshing={loading}
            onRefresh={() => {
              setLoading(true);
              eventApi.getUserEvents()
                .then(apiEvents => {
                  const formattedEvents = apiEvents.map(mapApiEventToComponentEvent);
                  setEvents(formattedEvents);
                  // Apply current filter to the refreshed events
                  const currentDate = new Date();
                  if (activeFilter === 'next') {
                    const upcomingEvents = formattedEvents.filter(event => new Date(event.startDate) >= currentDate);
                    const sortedEvents = upcomingEvents.sort((a, b) => 
                      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
                    );
                    setFilteredEvents(sortedEvents);
                  } else { // 'past'
                    const pastEvents = formattedEvents.filter(event => new Date(event.startDate) < currentDate);
                    const sortedEvents = pastEvents.sort((a, b) => 
                      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
                    );
                    setFilteredEvents(sortedEvents);
                  }
                })
                .catch(err => {
                  console.error('Error refreshing events:', err);
                })
                .finally(() => setLoading(false));
            }}
          />
          
          {/* Gift Search FAB - floating when events exist */}
          {activeFilter === 'next' && (
            <TouchableOpacity 
              style={styles.giftSearchFab}
              onPress={() => {
                router.push('/create-event-with-gifts');
              }}
            >
              <ThemedText style={styles.giftSearchFabText}>+</ThemedText>
            </TouchableOpacity>
          )}
        </>
      )}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
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
