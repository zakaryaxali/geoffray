import { useState, useCallback } from 'react';
import { sendChatMessage, ChatMessageRequest, ChatMessageResponse } from '../api/chatApi';

interface UseChatOptions {
  onError?: (error: Error) => void;
}

interface SendChatOptions {
  token: string;
  chat_id?: string;
  message: string;
}

export function useChat(options: UseChatOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const sendChat = useCallback(
    async ({ token, chat_id, message }: SendChatOptions): Promise<ChatMessageResponse | null> => {
      setLoading(true);
      setError(null);
      
      try {
        const startTime = new Date().getTime();
        console.log(`[TIMING] API call started at ${startTime}ms`);
        console.log('Sending chat message:', { chat_id, message });
        
        // Create the request payload
        const payload: ChatMessageRequest = {
          chat_id,
          message,
        };
        
        // Use the API client to send the message
        const response = await sendChatMessage(payload);
        const endTime = new Date().getTime();
        const duration = endTime - startTime;
        console.log(`[TIMING] API call completed at ${endTime}ms (took ${duration}ms)`);
        console.log('Chat response received:', response);
        
        setLoading(false);
        return response;
      } catch (err) {
        console.error('Error sending chat message:', err);
        const error = err instanceof Error ? err : new Error('Failed to send chat message');
        setError(error);
        setLoading(false);
        
        if (options.onError) {
          options.onError(error);
        }
        
        return null;
      }
    },
    [options.onError]
  );
  
  return {
    sendChat,
    loading,
    error,
  };
}
