import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/src/contexts/ThemeContext';
import { ThemedText } from '@/src/components/ThemedText';
import { IconSymbol } from '@/src/components/ui/IconSymbol';
import { getInitials } from './EventUtils';
import { eventStyles } from './EventStyles';
import { Colors } from '@/src/constants/Colors';
import { useEventMessages } from '@/src/hooks/useEventMessages';
import { EventMessage } from '@/src/api/eventMessageApi';
import { useAuth } from '@/src/contexts/AuthContext';

interface EventDiscussionProps {
  eventId: string;
  onScroll?: (offsetY: number) => void;
}

export const EventDiscussion: React.FC<EventDiscussionProps> = ({ eventId, onScroll }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user } = useAuth();
  const themeColors = theme === 'dark' ? Colors.dark : Colors.light;
  const [messageText, setMessageText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  
  // Use our custom hook to fetch and manage event messages
  const { messages, loading, error, sendMessage: apiSendMessage, refreshMessages } = useEventMessages(eventId);
  
  // Polling mechanism for fetching new messages
  useEffect(() => {
    let pollingInterval: ReturnType<typeof setInterval> | null = null;
    
    // Start polling when component mounts and not in loading state
    if (!loading) {
      pollingInterval = setInterval(() => {
        refreshMessages();
      }, 10000); // Poll every 10 seconds
    }
    
    // Clean up interval on unmount
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [loading, refreshMessages]);
  
  // Scroll to bottom on initial load or when new messages arrive
  useEffect(() => {
    if (!loading && messages.length > 0 && initialLoad) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
        setInitialLoad(false);
      }, 100);
    }
  }, [loading, messages, initialLoad]);
  
  // Handle scroll events
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (onScroll) {
      const offsetY = event.nativeEvent.contentOffset.y;
      onScroll(offsetY);
    }
  };
  
  // Generate avatar color based on user ID
  const getAvatarColor = (id: string) => {
    const colors = [
      '#4285F4', '#EA4335', '#FBBC05', '#34A853', 
      '#FF6D01', '#46BDC6', '#7E57C2', '#EC407A'
    ];
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Format timestamp to readable time
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshMessages();
    setRefreshing(false);
  }, [refreshMessages]);

  // Send a new message
  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    
    const success = await apiSendMessage(messageText.trim());
    if (success) {
      setMessageText('');
      // Scroll to bottom when sending a new message
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      // Refresh messages after a short delay to ensure we get the latest
      // including potential responses from other users
      setTimeout(() => {
        refreshMessages();
      }, 3000); // Refresh 3 seconds after sending a message
    }
  };

  // Get user's full name with (You) indicator if it's the current user
  const getUserFullName = (user: EventMessage['user']) => {
    return `${user.first_name} ${user.last_name}`;
  };

  // Loading state
  if (loading && !refreshing && messages.length === 0) {
    return (
      <View style={[eventStyles.discussionContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
        <ThemedText style={{ marginTop: 16 }}>{t('common.loading')}</ThemedText>
      </View>
    );
  }

  // Error state
  if (error && !refreshing && messages.length === 0) {
    return (
      <View style={[eventStyles.discussionContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <ThemedText style={{ color: themeColors.error, marginBottom: 16 }}>{error}</ThemedText>
        <TouchableOpacity 
          style={[eventStyles.refreshButton, { backgroundColor: themeColors.primary }]}
          onPress={refreshMessages}
        >
          <ThemedText style={{ color: '#FFFFFF' }}>{t('common.tryAgain')}</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[eventStyles.discussionContainer, { backgroundColor: themeColors.background }]}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        style={eventStyles.messagesList}
        onScroll={handleScroll}
        onContentSizeChange={() => {
          // Scroll to bottom when content size changes on initial load
          if (initialLoad && messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: false });
            setInitialLoad(false);
          }
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[themeColors.primary]} />
        }
        renderItem={({ item }) => (
          <View style={[eventStyles.messageItem, { backgroundColor: themeColors.surface }]}>
            <View style={eventStyles.messageHeader}>
              <View 
                style={[
                  eventStyles.messageAvatar, 
                  { backgroundColor: getAvatarColor(item.user.id) }
                ]}
              >
                <ThemedText style={eventStyles.participantInitials}>
                  {getInitials(getUserFullName(item.user))}
                </ThemedText>
              </View>
              <ThemedText style={[eventStyles.messageSender, { color: themeColors.text }]}>
                {getUserFullName(item.user)}
                {user && user.id === item.user.id && (
                  <ThemedText style={[{ color: themeColors.primary, fontStyle: 'italic' }]}> ({t('common.you')})</ThemedText>
                )}
              </ThemedText>
              <ThemedText style={[eventStyles.messageTime, { color: themeColors.textSecondary }]}>
                {formatTimestamp(item.created_at)}
              </ThemedText>
            </View>
            <ThemedText style={[eventStyles.messageContent, { color: themeColors.text }]}>
              {item.content}
            </ThemedText>
          </View>
        )}
        ListEmptyComponent={
          <View style={eventStyles.emptyMessagesContainer}>
            <ThemedText style={{ color: themeColors.textSecondary, textAlign: 'center' }}>
              {t('event.noMessages')}
            </ThemedText>
          </View>
        }
      />
      
      <View style={[eventStyles.inputContainer, { borderTopColor: themeColors.border }]}>
        <TextInput
          style={[
            eventStyles.messageInput, 
            { 
              borderColor: themeColors.border,
              color: themeColors.text,
              backgroundColor: themeColors.surface
            }
          ]}
          placeholder={t('event.typeMessage')}
          placeholderTextColor={themeColors.textSecondary}
          value={messageText}
          onChangeText={setMessageText}
        />
        <TouchableOpacity 
          style={[
            eventStyles.sendButton, 
            { 
              backgroundColor: themeColors.primary,
              opacity: messageText.trim() ? 1 : 0.5
            }
          ]}
          onPress={handleSendMessage}
          disabled={!messageText.trim()}
        >
          <IconSymbol name="paperplane.fill" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
