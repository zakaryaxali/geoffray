import { useState, useEffect, useCallback } from 'react';
import { EventMessage, EventMessageCreateRequest, eventMessageApi } from '@/src/api/eventMessageApi';

/**
 * Custom hook for managing event messages
 * @param eventId The ID of the event to fetch messages for
 */
export const useEventMessages = (eventId: string) => {
  const [messages, setMessages] = useState<EventMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch messages for the event
  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedMessages = await eventMessageApi.getEventMessages(eventId);
      setMessages(fetchedMessages);
      setError(null);
    } catch (err) {
      console.error('Error fetching event messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  // Send a new message
  const sendMessage = useCallback(async (content: string, parentId?: string): Promise<boolean> => {
    try {
      const messageData: EventMessageCreateRequest = {
        content,
        parent_id: parentId
      };
      
      const newMessage = await eventMessageApi.createEventMessage(eventId, messageData);
      
      if (newMessage) {
        // Refresh messages to include the new one
        await fetchMessages();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      return false;
    }
  }, [eventId, fetchMessages]);

  // Load messages when the component mounts or eventId changes
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    refreshMessages: fetchMessages
  };
};
