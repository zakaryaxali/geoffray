import { apiClient } from './apiClient';

/**
 * Interface for chat message request
 */
export interface ChatMessageRequest {
  chat_id?: string;
  message: string;
}

/**
 * Interface for chat message response
 */
export interface ChatMessageResponse {
  response: string;  // The AI response content
  chat_id: string;   // The chat ID
}

/**
 * Send a chat message using the regular (non-streaming) endpoint
 * @param data The chat message request data
 * @returns Promise with the chat message response
 */
export const sendChatMessage = async (data: ChatMessageRequest): Promise<ChatMessageResponse> => {
  return apiClient.post<ChatMessageResponse>('/chat/', data, true);
};

/**
 * Get chat history for a specific chat
 * @param chatId The chat ID
 * @returns Promise with an array of chat messages
 */
export const getChatHistory = async (chatId: string): Promise<ChatMessageResponse[]> => {
  return apiClient.get<ChatMessageResponse[]>(`/chat/history/${chatId}`, true);
};

/**
 * Get chats for a specific event
 * @param eventId The event ID
 * @returns Promise with an array of chat messages
 */
export const getChatsByEventId = async (eventId: string): Promise<ChatMessageResponse[]> => {
  return apiClient.get<ChatMessageResponse[]>(`/chat/event/${eventId}`, true);
};
