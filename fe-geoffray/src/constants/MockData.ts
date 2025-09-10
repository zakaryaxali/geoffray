import {Event} from '@/src/components/EventCard';

// Mock data for events
export const mockEvents: Event[] = [
  {
    id: '1',
    name: 'Summer Picnic',
    startDate: '2025-06-15T12:00:00',
    isActive: true,
    participants: [
      { id: '1', name: 'John Doe', photoUrl: 'https://randomuser.me/api/portraits/men/1.jpg' },
      { id: '2', name: 'Jane Smith', photoUrl: 'https://randomuser.me/api/portraits/women/2.jpg' },
      { id: '3', name: 'Mike Johnson' },
      { id: '4', name: 'Sarah Williams' },
    ],
    // Using placeholder images for now
    backgroundImage: { uri: 'https://images.unsplash.com/photo-1526491109672-74740652b963?q=80&w=500' },
    location: 'My Backyard',
  },
  {
    id: '2',
    name: 'Tech Conference',
    startDate: '2025-04-10T09:00:00',
    endDate: '2025-04-12T18:00:00',
    isActive: true,
    participants: [
      { id: '1', name: 'John Doe', photoUrl: 'https://randomuser.me/api/portraits/men/1.jpg' },
      { id: '5', name: 'Alex Brown', photoUrl: 'https://randomuser.me/api/portraits/men/5.jpg' },
      { id: '6', name: 'Emma Davis', photoUrl: 'https://randomuser.me/api/portraits/women/6.jpg' },
    ],
    backgroundImage: { uri: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=500' },
    location: '1 Infinite Loop, Cupertino, CA 95014',
  },
  {
    id: '3',
    name: 'Birthday Party',
    startDate: '2025-05-20T19:00:00',
    isActive: true,
    participants: [
      { id: '2', name: 'Jane Smith', photoUrl: 'https://randomuser.me/api/portraits/women/2.jpg' },
      { id: '3', name: 'Mike Johnson' },
      { id: '7', name: 'Oliver Wilson' },
      { id: '8', name: 'Sophia Martin' },
      { id: '9', name: 'Lucas Thompson' },
    ],
    backgroundImage: { uri: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=500' },
  },
  {
    id: '4',
    name: 'Book Club Meeting',
    startDate: '2025-01-15T18:30:00',
    isActive: false,
    participants: [
      { id: '4', name: 'Sarah Williams' },
      { id: '6', name: 'Emma Davis', photoUrl: 'https://randomuser.me/api/portraits/women/6.jpg' },
      { id: '10', name: 'Ethan Clark' },
    ],
    backgroundImage: { uri: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=500' },
  },
  {
    id: '5',
    name: 'Hiking Trip',
    startDate: '2024-11-05T08:00:00',
    endDate: '2024-11-07T18:00:00',
    isActive: false,
    participants: [
      { id: '1', name: 'John Doe', photoUrl: 'https://randomuser.me/api/portraits/men/1.jpg' },
      { id: '3', name: 'Mike Johnson' },
      { id: '5', name: 'Alex Brown', photoUrl: 'https://randomuser.me/api/portraits/men/5.jpg' },
      { id: '11', name: 'Isabella Lee' },
    ],
    backgroundImage: { uri: 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=500' },
    location: 'Yosemite National Park, California',
  },
];
