import React, {useEffect, useState} from 'react';
import {ActivityIndicator, FlatList, SafeAreaView, StatusBar, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';

import {ThemedText} from '@/src/components/ThemedText';
import {ThemedView} from '@/src/components/ThemedView';
import {Event, EventCard} from '@/src/components/EventCard';
import {EventsFilter, FilterType} from '@/src/components/EventsFilter';
import {eventApi, EventResponse} from '@/src/api/eventApi';

// Array of random event banner images
const randomEventBanners = [
  { uri: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80' },
  { uri: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80' },
  { uri: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80' },
  { uri: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80' },
  { uri: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80' },
  { uri: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80' },
];

// Function to get a random banner image
const getRandomBanner = () => {
  const randomIndex = Math.floor(Math.random() * randomEventBanners.length);
  return randomEventBanners[randomIndex];
};

// Convert API event format to component event format
const mapApiEventToComponentEvent = (apiEvent: EventResponse): Event => {
  return {
    id: apiEvent.id,
    name: apiEvent.title,
    startDate: apiEvent.start_date,
    endDate: apiEvent.end_date,
    isActive: apiEvent.active,
    participantsCount: apiEvent.participants_count || 0,
    backgroundImage: apiEvent.banner ? { uri: apiEvent.banner } : getRandomBanner(),
    location: apiEvent.location,
  };
};

export default function HomeScreen() {
  const { t } = useTranslation();
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
        <ThemedView style={styles.header}>
          <ThemedText type="title">{t('home.events')}</ThemedText>
        </ThemedView>
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
        <ThemedView style={styles.header}>
          <ThemedText type="title">{t('home.events')}</ThemedText>
        </ThemedView>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ThemedView style={styles.header}>
        <ThemedText type="title">{t('home.events')}</ThemedText>
      </ThemedView>
      
      <EventsFilter 
        activeFilter={activeFilter} 
        onFilterChange={handleFilterChange} 
      />
      
      {filteredEvents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>
            {activeFilter === 'next' 
              ? t('home.noUpcomingEvents') 
              : t('home.noPastEvents')}
          </ThemedText>
        </View>
      ) : (
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
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 16, // Increased left padding to match container horizontal padding
  },
  listContent: {
    paddingBottom: 20,
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
});
