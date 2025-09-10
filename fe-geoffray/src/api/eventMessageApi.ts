import { apiClient } from './apiClient';

export interface EventMessage {
  id: string;
  event_id: string;
  user_id: string;
  content: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface EventMessageCreateRequest {
  content: string;
  parent_id?: string;
}

export const eventMessageApi = {
  /**
   * Get all messages for an event
   */
  getEventMessages: async (eventId: string): Promise<EventMessage[]> => {
    try {
      const response = await apiClient.get<EventMessage[] | { messages: EventMessage[] }>(
        `/events/${eventId}/messages/`,
        true
      );
      
      // Handle both response formats (array or object with messages property)
      if (Array.isArray(response)) {
        return response;
      } else if (response && response.messages) {
        return response.messages;
      } else {
        console.log('Unexpected response format:', response);
        return [];
      }
    } catch (error) {
      console.error('Error fetching event messages:', error);
      return [];
    }
  },

  /**
   * Create a new message for an event
   */
  createEventMessage: async (eventId: string, messageData: EventMessageCreateRequest): Promise<EventMessage | null> => {
    try {
      const response = await apiClient.post<EventMessage | { message: EventMessage }>(
        `/events/${eventId}/messages/`,
        messageData,
        true
      );
      
      // Handle both response formats (direct message object or wrapped in message property)
      if (response && 'message' in response) {
        return response.message;
      } else if (response && 'id' in response) {
        return response as EventMessage;
      } else {
        console.log('Unexpected response format:', response);
        return null;
      }
    } catch (error) {
      console.error('Error creating event message:', error);
      return null;
    }
  }
};
