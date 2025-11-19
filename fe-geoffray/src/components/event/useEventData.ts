import { useState, useEffect } from 'react';
import { eventApi, EventResponse, ParticipantInviteRequest, ParticipantInviteResponse, UpdateEventRequest, PendingInvitation } from '@/src/api/eventApi';
import { mapParticipantStatus } from './EventUtils';

export interface Participant {
  id: string;
  name: string;
  email: string;
  status: 'going' | 'pending' | 'not_going';
}

export interface EventData {
  event: EventResponse | null;
  participants: Participant[];
  pendingInvitations: PendingInvitation[];
  loading: boolean;
  error: string;
  inviteParticipant: (request: ParticipantInviteRequest) => Promise<ParticipantInviteResponse>;
  refreshEvent: () => Promise<void>;
  updateParticipantStatus: (participantId: string, newStatus: 'going' | 'pending' | 'not_going') => Promise<boolean>;
  updateEvent: (updateData: UpdateEventRequest) => Promise<boolean>;
  rescindInvitation: (email: string) => Promise<boolean>;
  getInviteLink: (email: string) => Promise<string | null>;
  isCreator: boolean;
}

export const useEventData = (eventId: string | string[]): EventData => {
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreator, setIsCreator] = useState(false);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!eventId) {
        setError('Event ID is missing');
        return;
      }
      
      // Convert id to string if it's not already
      const id = typeof eventId === 'object' ? String(eventId) : eventId;

      // Fetch the event, participants, and pending invitations from the API
      const { event: eventData, participants: participantsData, pendingInvitations: pendingInvitationsData } = await eventApi.getEventById(id);
      setEvent(eventData);
      setPendingInvitations(pendingInvitationsData);
      
      // Check if current user is the creator
      try {
        const currentUserId = await eventApi.getCurrentUserId();
        setIsCreator(eventData.creator_id === currentUserId);
      } catch (error) {
        console.error('Error determining if user is creator:', error);
        setIsCreator(false);
      }
      
      // Transform the participants data to match our UI format
      const formattedParticipants = participantsData.map(p => {
        const backendStatus = p.status;
        let frontendStatus: 'going' | 'pending' | 'not_going';

        // Map backend status to frontend status
        switch (backendStatus.toLowerCase()) {
          case 'accepted':
            frontendStatus = 'going';
            break;
          case 'declined':
            frontendStatus = 'not_going';
            break;
          case 'pending':
          default:
            frontendStatus = 'pending';
            break;
        }

        return {
          id: p.id,
          name: `${p.first_name} ${p.last_name}`,
          email: p.email,
          status: frontendStatus
        };
      });
      
      setParticipants(formattedParticipants);
    } catch (error) {
      console.error('Error fetching event:', error);
      setError('Event not found or could not be loaded');
      setEvent(null);
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  // Invite a participant to the event
  const inviteParticipant = async (request: ParticipantInviteRequest): Promise<ParticipantInviteResponse> => {
    if (!eventId) {
      throw new Error('Event ID is missing');
    }

    const id = typeof eventId === 'object' ? String(eventId) : eventId;
    const response = await eventApi.inviteParticipant(id, request);

    // Don't refresh here - let the modal close first, then parent will refresh
    // This prevents the modal state from being reset by the parent re-render

    return response;
  };

  // Update a participant's status - only for the current user
  const updateParticipantStatus = async (participantId: string, newStatus: 'going' | 'pending' | 'not_going'): Promise<boolean> => {
    if (!eventId) {
      throw new Error('Event ID is missing');
    }

    try {
      const id = typeof eventId === 'object' ? String(eventId) : eventId;

      // Convert frontend status to backend status
      const backendStatus = mapParticipantStatus(newStatus);

      // Call the API to update the status
      // The API will verify the user's identity using the JWT token
      await eventApi.updateParticipantStatus(id, { status: backendStatus });

      // Update the local state without fetching from the server again
      setParticipants(prevParticipants =>
        prevParticipants.map(p =>
          p.id === participantId ? { ...p, status: newStatus } : p
        )
      );

      return true;
    } catch (error) {
      console.error('Error updating participant status:', error);
      return false;
    }
  };

  // Update event details (title, description, dates, location)
  const updateEvent = async (updateData: UpdateEventRequest): Promise<boolean> => {
    if (!eventId || !event) {
      throw new Error('Event ID is missing or event not loaded');
    }

    try {
      const id = typeof eventId === 'object' ? String(eventId) : eventId;

      // Call the API to update the event
      const updatedEvent = await eventApi.updateEvent(id, updateData);

      // Update the local state with the updated event
      setEvent(updatedEvent);

      return true;
    } catch (error) {
      console.error('Error updating event:', error);
      return false;
    }
  };

  // Rescind an invitation
  const rescindInvitation = async (email: string): Promise<boolean> => {
    if (!eventId) {
      throw new Error('Event ID is missing');
    }

    try {
      const id = typeof eventId === 'object' ? String(eventId) : eventId;

      // Call the API to rescind the invitation
      await eventApi.rescindInvitation(id, email);

      // Update local state by removing the invitation from the list
      setPendingInvitations(prevInvitations =>
        prevInvitations.filter(inv => inv.email !== email && inv.phone !== email)
      );

      return true;
    } catch (error) {
      console.error('Error rescinding invitation:', error);
      return false;
    }
  };

  // Get invite link for an email (by re-inviting)
  const getInviteLink = async (email: string): Promise<string | null> => {
    if (!eventId) {
      throw new Error('Event ID is missing');
    }

    try {
      const id = typeof eventId === 'object' ? String(eventId) : eventId;

      // Call the invite API which will return the existing invite link
      const response = await eventApi.inviteParticipant(id, {
        identifier: email,
        type: 'email'
      });

      return response.inviteLink || null;
    } catch (error) {
      console.error('Error getting invite link:', error);
      return null;
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  return {
    event,
    participants,
    pendingInvitations,
    loading,
    error,
    inviteParticipant,
    refreshEvent: fetchEvent,
    updateParticipantStatus,
    updateEvent,
    rescindInvitation,
    getInviteLink,
    isCreator
  };
};
