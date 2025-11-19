import { apiClient } from './apiClient';
import { apiConfig } from './config';
import { getToken } from './authApi';

export interface EventCreateRequest {
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  banner?: string;
  location?: string;
}

export interface GiftEventCreateRequest extends EventCreateRequest {
  giftee_persona: string;
  event_occasion: string;
}

export interface Participant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
}

export interface EventResponse {
  id: string;
  title: string;
  description: string;
  creator_id: string;
  start_date: string;
  end_date?: string;
  active: boolean;
  banner?: string;
  location?: string;
  created_at: string;
  updated_at: string;
  participants_count: number;
  giftee_persona?: string;
  event_occasion?: string;
}

export interface PendingInvitation {
  email?: string;
  phone?: string;
  invitedAt: string;
  expiresAt: string;
}

export interface ParticipantInviteRequest {
  identifier: string; // email
  type: 'email';
}

export interface ParticipantInviteResponse {
  success: boolean;
  message: string;
  userExists: boolean;
  inviteLink?: string;
}

export interface InviteValidationResponse {
  valid: boolean;
  eventId?: string;
  eventTitle?: string;
  expired?: boolean;
  message: string;
  invitedEmail?: string;
}

export interface UpdateParticipantStatusRequest {
  status: 'accepted' | 'pending' | 'declined';
}

export interface UpdateParticipantStatusResponse {
  message: string;
  status: string;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string | null;
  location?: string;
  remove_end_date?: boolean;
}

export const eventApi = {
  /**
   * Get the current user's ID from JWT token
   */
  getCurrentUserId: async (): Promise<string> => {
    try {
      // Get token from storage
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Decode the JWT token using the same approach as AuthContext
      const base64Url = token.split('.')[1];
      if (!base64Url) {
        throw new Error('Invalid token format: missing payload section');
      }
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      
      // Decode the base64 string
      const jsonPayload = decodeURIComponent(
        atob(base64).split('').map(c => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join('')
      );
      
      const decodedToken = JSON.parse(jsonPayload);
      
      // Extract user ID from payload - check multiple possible field names
      const userId = decodedToken.sub || decodedToken.id || decodedToken.user_id;
      if (!userId) {
        throw new Error('User ID not found in token');
      }
      
      return userId;
    } catch (error) {
      console.error('Error getting current user ID from token:', error);
      // Fallback to API call if token parsing fails
      try {
        const response = await apiClient.get<{ id: string }>('/users/me', true);
        return response.id;
      } catch (fallbackError) {
        console.error('Fallback API call also failed:', fallbackError);
        throw error; // Throw the original error
      }
    }
  },
  /**
   * Create a new event
   */
  createEvent: async (eventData: EventCreateRequest): Promise<EventResponse> => {
    const response = await apiClient.post<{ message: string; event: EventResponse }>(
      '/events/', 
      eventData, 
      true
    );
    return response.event;
  },

  /**
   * Create a new event with gift suggestions
   */
  createEventWithGifts: async (eventData: GiftEventCreateRequest): Promise<EventResponse> => {
    const response = await apiClient.post<EventResponse>(
      '/api/events/with-gifts', 
      eventData, 
      true
    );
    return response;
  },

  /**
   * Get all events for the current user
   */
  getUserEvents: async (): Promise<EventResponse[]> => {
    const response = await apiClient.get<{ events: EventResponse[] }>(
      '/events/me', 
      true
    );
    return response.events;
  },

  /**
   * Get a specific event by ID and its participants
   */
  getEventById: async (eventId: string): Promise<{ event: EventResponse, participants: Participant[], pendingInvitations: PendingInvitation[] }> => {
    const response = await apiClient.get<{ event: EventResponse, participants: Participant[], pendingInvitations: PendingInvitation[] }>(
      `/events/${eventId}`,
      true
    );
    return {
      event: response.event,
      participants: response.participants || [],
      pendingInvitations: response.pendingInvitations || []
    };
  },
  
  /**
   * Invite a participant to an event
   */
  inviteParticipant: async (eventId: string, participantData: ParticipantInviteRequest): Promise<ParticipantInviteResponse> => {
    const response = await apiClient.post<any>(
      `/events/${eventId}/participants`,
      participantData,
      true
    );

    // Normalize backend response (PascalCase to camelCase)
    return {
      success: response.success ?? response.Success ?? true,
      message: response.message ?? response.Message ?? '',
      userExists: response.userExists ?? response.UserExists ?? false,
      inviteLink: response.inviteLink ?? response.InviteLink
    };
  },
  
  /**
   * Validate an invitation code and get event details
   */
  validateInvite: async (inviteCode: string): Promise<InviteValidationResponse> => {
    const response = await apiClient.get<InviteValidationResponse>(
      `/invites/${inviteCode}`
    );
    return response;
  },
  
  /**
   * Accept an invitation and join the event
   */
  acceptInvite: async (inviteCode: string): Promise<{success: boolean; message: string; eventId?: string}> => {
    const response = await apiClient.post<{message: string; event_id: string}>(
      `/invites/${inviteCode}/accept`,
      {}
    );
    return {
      success: true,
      message: response.message,
      eventId: response.event_id
    };
  },

  /**
   * Update the current user's participant status for an event
   */
  updateParticipantStatus: async (eventId: string, statusData: UpdateParticipantStatusRequest): Promise<UpdateParticipantStatusResponse> => {
    try {
      const response = await apiClient.put<UpdateParticipantStatusResponse>(
        `/events/${eventId}/participant-status`,
        statusData
      );
      return response;
    } catch (error) {
      console.error('Error updating participant status:', error);
      throw error;
    }
  },

  /**
   * Rescind a pending invitation
   */
  rescindInvitation: async (eventId: string, email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.delete<{ success: boolean; message: string }>(
        `/events/${eventId}/invitations/${encodeURIComponent(email)}`,
        true
      );
      return response;
    } catch (error) {
      console.error('Error rescinding invitation:', error);
      throw error;
    }
  },

  /**
   * Update event details (only available to the event creator)
   */
  updateEvent: async (eventId: string, updateData: UpdateEventRequest): Promise<EventResponse> => {
    try {
      console.log('updateEvent API call with data:', JSON.stringify(updateData));

      const response = await apiClient.put<{ message: string; event: EventResponse }>(
        `/events/${eventId}`,
        updateData,
        true
      );
      
      console.log('updateEvent API response:', JSON.stringify(response));
      return response.event;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  },
};
