import { useRef, useCallback, useEffect } from 'react';
import RNEventSource from 'react-native-event-source';
import { apiConfig } from '../api';

export function useChatStream() {
  const abortController = useRef<AbortController | null>(null); 
  const eventSourceRef = useRef<RNEventSource | null>(null);

  const streamChat = useCallback(
    ({ 
      token,
      chat_id,
      message,
      onMessage,
      onError,
      onComplete,
    }: {
      token: string;
      chat_id?: string;
      message: string;
      onMessage: (chunk: string) => void;
      onError?: (err: any) => void;
      onComplete?: () => void;
    }) => {
      console.log('Attempting stream with react-native-event-source:', { token, chat_id, message });
      
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      const url = `${apiConfig.baseUrl}/chat/stream`;
      const options = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ chat_id, message }),
      };

      try {
        eventSourceRef.current = new RNEventSource(url, options);

        eventSourceRef.current.addEventListener('open', (event: any) => {
          console.log('RNEventSource connection opened:', event);
        });

        eventSourceRef.current.addEventListener('message', (event: any) => {
          const messageData = (event as any).data;
          console.log('RNEventSource message received:', messageData, typeof messageData); 
          
          if (messageData) {
            // Check if this is a completion signal
            if (messageData === '[DONE]' || 
                messageData.includes('[DONE]') ||
                messageData.includes('data: [DONE]') ||
                (typeof messageData === 'string' && messageData.trim() === '')) {
              console.log('Stream completed with [DONE] or empty message');
              if (eventSourceRef.current) {
                console.log('Closing EventSource connection');
                eventSourceRef.current.close();
                eventSourceRef.current = null;
              }
              onComplete?.();
              return;
            }
            
            // Debug what's being processed
            console.log('Processing message data:', { 
              isString: typeof messageData === 'string',
              length: typeof messageData === 'string' ? messageData.length : 'N/A',
              startsWithData: typeof messageData === 'string' ? messageData.startsWith('data:') : false,
              isJSON: (() => {
                try {
                  JSON.parse(messageData);
                  return true;
                } catch (e) {
                  return false;
                }
              })()
            });
            
            // Try to parse JSON if the message is in JSON format
            try {
              const jsonData = JSON.parse(messageData);
              console.log('Successfully parsed JSON:', jsonData);
              
              // Check for different possible formats
              if (jsonData.text) {
                console.log('Found text field in JSON:', jsonData.text);
                onMessage(jsonData.text);
              } else if (jsonData.content) {
                console.log('Found content field in JSON:', jsonData.content);
                onMessage(jsonData.content);
              } else if (jsonData.choices && jsonData.choices[0]?.delta?.content) {
                // Handle OpenAI-style streaming format
                console.log('Found OpenAI delta format:', jsonData.choices[0].delta.content);
                onMessage(jsonData.choices[0].delta.content);
              } else if (jsonData.choices && jsonData.choices[0]?.message?.content) {
                // Handle OpenAI-style non-streaming format
                console.log('Found OpenAI message format:', jsonData.choices[0].message.content);
                onMessage(jsonData.choices[0].message.content);
              } else {
                // If we can't find a known field, send the whole message as a string
                console.log('No recognized format in JSON, using stringified version');
                onMessage(JSON.stringify(jsonData));
              }
            } catch (e: any) {
              console.log('Not JSON, treating as plain text:', e.message);
              
              // For SSE, the message data is often just the raw text without any JSON wrapping
              // Just pass it directly to the onMessage callback
              if (typeof messageData === 'string') {
                // Check if it's a data: prefix (common in SSE)
                if (messageData.startsWith('data:')) {
                  const content = messageData.substring(5).trim();
                  console.log('Found data: prefix, extracted content:', content);
                  if (content && content !== '[DONE]') {
                    console.log('Sending extracted content to onMessage');
                    onMessage(content);
                  }
                } else if (messageData !== '[DONE]') {
                  // If it's not a completion signal, send it as is
                  console.log('Sending raw message data to onMessage');
                  onMessage(messageData);
                }
              }
            }
          } else {
            console.warn('RNEventSource received message with no data:', event);
          }
        });

        eventSourceRef.current.addEventListener('error', (event: any) => {
          console.error('RNEventSource error:', event);
          const errorMessage = (event as any).message || 'Unknown SSE error';
          
          // Some servers close the connection with an error event when done
          // Check if this might be a normal completion
          if ((event as any).type === 'error' && !errorMessage.includes('failure')) {
            console.log('Stream possibly completed (error event with no specific error)');
            onComplete?.();
          } else {
            onError?.(new Error(errorMessage));
          }
          
          // Clean up the event source
          eventSourceRef.current?.close();
          eventSourceRef.current = null;
        });

      } catch (error) {
        console.error('Error initializing RNEventSource:', error);
        onError?.(error instanceof Error ? error : new Error('Failed to initialize event source'));
      }
    },
    []
  );

  const abort = useCallback(() => {
    console.log('Abort requested');
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    console.log('RNEventSource closed via abort.');
  }, []);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        console.log('Closing RNEventSource on unmount');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  return { streamChat, abort };
}
