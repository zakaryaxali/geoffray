import React, { useState, useEffect } from 'react';
import { ScrollView, View, TouchableOpacity, ActivityIndicator, Alert, Linking, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/src/components/ThemedText';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { Colors, BrandColors } from '@/src/constants/Colors';
import { eventStyles } from './EventStyles';
import { apiClient } from '@/src/api/apiClient';
import { useRouter } from 'expo-router';

interface GiftSuggestion {
  id: string;
  event_id: string;
  owner_id: string;
  name_en: string;
  name_fr: string;
  description_en: string;
  description_fr: string;
  price_range: string;
  category: string;
  url?: string;
  prompt?: string;
  creation_mode: string;
  generated_at: string;
  created_at: string;
  updated_at: string;
  upvote_count: number;
  downvote_count: number;
  user_vote?: 'upvote' | 'downvote' | null;
  // Amazon affiliate fields
  amazon_asin?: string;
  amazon_affiliate_url?: string;
  amazon_price?: string;
  amazon_region?: string;
  is_affiliate_link?: boolean;
}

interface EventGiftsProps {
  eventId: string;
  isCreator: boolean;
}

export const EventGifts: React.FC<EventGiftsProps> = ({ eventId, isCreator }) => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const themeColors = theme === 'dark' ? Colors.dark : Colors.light;
  
  const [suggestions, setSuggestions] = useState<GiftSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [votingStates, setVotingStates] = useState<Record<string, boolean>>({});
  const [deletingStates, setDeletingStates] = useState<Record<string, boolean>>({});
  const [isPolling, setIsPolling] = useState(true);
  
  const isEnglish = i18n.language === 'en';

  // Fetch gift suggestions
  const fetchGiftSuggestions = async () => {
    try {
      const response = await apiClient.get<GiftSuggestion[]>(
        `/api/events/${eventId}/gift-suggestions`,
        true
      );
      setSuggestions(response || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching gift suggestions:', err);
      if (err.status === 404) {
        setSuggestions([]);
        setError(null);
      } else {
        setError(t('event.gifts.fetchError'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Generate or regenerate gift suggestions
  const handleRegenerateGifts = async () => {
    const isInitialGeneration = !suggestions || suggestions.length === 0;
    
    Alert.alert(
      isInitialGeneration ? t('event.gifts.generateTitle') : t('event.gifts.regenerateTitle'),
      isInitialGeneration ? t('event.gifts.generateMessage') : t('event.gifts.regenerateMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: isInitialGeneration ? t('event.gifts.generate') : t('event.gifts.regenerate'),
          style: 'default',
          onPress: async () => {
            try {
              setRegenerating(true);
              await apiClient.post(
                `/api/events/${eventId}/regenerate-gift-suggestions`,
                {},
                true
              );
              
              // Wait a moment then refresh
              setTimeout(() => {
                fetchGiftSuggestions();
                setRegenerating(false);
              }, 2000);
              
            } catch (err: any) {
              console.error('Error generating suggestions:', err);
              setError(t('event.gifts.regenerateError'));
              setRegenerating(false);
            }
          }
        }
      ]
    );
  };

  // Open gift URL
  const handleOpenGift = async (url: string) => {
    if (url) {
      try {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          Alert.alert(t('event.gifts.errorTitle'), t('event.gifts.cannotOpenUrl'));
        }
      } catch (error) {
        console.error('Error opening URL:', error);
        Alert.alert(t('event.gifts.errorTitle'), t('event.gifts.openUrlError'));
      }
    }
  };

  // Handle voting on a suggestion
  const handleVote = async (suggestionId: string, voteType: 'upvote' | 'downvote') => {
    if (votingStates[suggestionId]) return; // Prevent double-clicking
    
    setVotingStates(prev => ({ ...prev, [suggestionId]: true }));
    
    try {
      const suggestion = suggestions.find(s => s.id === suggestionId);
      if (!suggestion) return;

      // If user is clicking the same vote type, remove the vote
      if (suggestion.user_vote === voteType) {
        await apiClient.delete(`/api/gift-suggestions/${suggestionId}/vote`, true);
        
        // Update local state - remove vote
        setSuggestions(prev => prev.map(s => 
          s.id === suggestionId 
            ? { 
                ...s, 
                user_vote: null,
                upvote_count: voteType === 'upvote' ? s.upvote_count - 1 : s.upvote_count,
                downvote_count: voteType === 'downvote' ? s.downvote_count - 1 : s.downvote_count
              }
            : s
        ));
      } else {
        // Vote or change vote
        await apiClient.post(
          `/api/gift-suggestions/${suggestionId}/vote`,
          { vote_type: voteType },
          true
        );

        // Update local state
        setSuggestions(prev => prev.map(s => {
          if (s.id === suggestionId) {
            const wasUpvote = s.user_vote === 'upvote';
            const wasDownvote = s.user_vote === 'downvote';
            
            return {
              ...s,
              user_vote: voteType,
              upvote_count: voteType === 'upvote' 
                ? s.upvote_count + 1 
                : wasUpvote ? s.upvote_count - 1 : s.upvote_count,
              downvote_count: voteType === 'downvote' 
                ? s.downvote_count + 1 
                : wasDownvote ? s.downvote_count - 1 : s.downvote_count
            };
          }
          return s;
        }));
      }
    } catch (error) {
      console.error('Error voting on suggestion:', error);
      Alert.alert(t('event.gifts.errorTitle'), 'Failed to record vote');
    } finally {
      setVotingStates(prev => ({ ...prev, [suggestionId]: false }));
    }
  };

  // Handle deleting a suggestion
  const handleDeleteSuggestion = async (suggestionId: string) => {
    if (deletingStates[suggestionId]) return; // Prevent double-clicking
    
    console.log('Delete button clicked for suggestion:', suggestionId);
    
    // Cross-platform confirmation
    const performDeletion = async () => {
      setDeletingStates(prev => ({ ...prev, [suggestionId]: true }));
      
      try {
        await apiClient.delete(`/api/gift-suggestions/${suggestionId}`, true);
        
        // Remove suggestion from local state
        setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
        
      } catch (error) {
        console.error('Error deleting suggestion:', error);
        const errorMessage = t('giftEvent.deleteError');
        
        if (Platform.OS === 'web') {
          alert(errorMessage);
        } else {
          Alert.alert('Error', errorMessage);
        }
      } finally {
        setDeletingStates(prev => ({ ...prev, [suggestionId]: false }));
      }
    };

    // Show confirmation dialog based on platform
    if (Platform.OS === 'web') {
      // Use browser confirm on web
      const confirmed = confirm(t('giftEvent.deleteConfirm'));
      if (confirmed) {
        await performDeletion();
      }
    } else {
      // Use native Alert.alert on mobile
      Alert.alert(
        t('common.confirm'),
        t('giftEvent.deleteConfirm'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.delete'),
            style: 'destructive',
            onPress: performDeletion
          }
        ]
      );
    }
  };

  // Handle modifying a suggestion
  const handleModifySuggestion = (suggestion: GiftSuggestion) => {
    // Determine current language values for pre-filling
    const currentName = isEnglish ? suggestion.name_en : suggestion.name_fr;
    const currentDesc = isEnglish ? suggestion.description_en : suggestion.description_fr;

    router.push({
      pathname: `/event/${eventId}/add-suggestion`,
      params: {
        edit_id: suggestion.id,
        mode: suggestion.creation_mode || 'manual',
        name: currentName,
        description: currentDesc,
        priceRange: suggestion.price_range,
        category: suggestion.category,
        url: suggestion.url || '',
        prompt: suggestion.prompt || '',
      }
    });
  };

  // Initial fetch and polling for AI suggestions
  useEffect(() => {
    if (eventId) {
      fetchGiftSuggestions();

      // Poll every 3 seconds until we have 3+ suggestions
      const interval = setInterval(() => {
        if (isPolling) {
          fetchGiftSuggestions();
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [eventId, isPolling]);

  // Stop polling when we have enough suggestions
  useEffect(() => {
    if (suggestions.length >= 3) {
      setIsPolling(false);
    }
  }, [suggestions.length]);

  if (loading) {
    return (
      <View style={[eventStyles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
        <ThemedText style={{ marginTop: 16, color: themeColors.text }}>
          {t('event.gifts.loading')}
        </ThemedText>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[eventStyles.container, { backgroundColor: themeColors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ padding: 20 }}>
        {/* Header */}
        <View style={{
          marginBottom: 20
        }}>
          <ThemedText style={{ fontSize: 24, fontWeight: 'bold', color: themeColors.text }}>
            {t('event.gifts.title')}
          </ThemedText>
        </View>

        {/* Error State */}
        {error && (
          <View style={{
            backgroundColor: '#fee',
            padding: 16,
            borderRadius: 8,
            marginBottom: 20,
          }}>
            <ThemedText style={{ color: '#c33', textAlign: 'center' }}>
              {error}
            </ThemedText>
          </View>
        )}

        {/* No Suggestions State */}
        {!loading && !error && suggestions && suggestions.length === 0 && (
          <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
          }}>
            <Ionicons name="gift-outline" size={64} color={themeColors.textSecondary} />
            <ThemedText style={{
              fontSize: 18,
              fontWeight: '600',
              color: themeColors.text,
              marginTop: 16,
              textAlign: 'center',
            }}>
              {t('event.gifts.noSuggestions')}
            </ThemedText>
            <ThemedText style={{
              fontSize: 14,
              color: themeColors.textSecondary,
              marginTop: 8,
              textAlign: 'center',
            }}>
              {t('event.gifts.noSuggestionsDesc')}
            </ThemedText>
            
            {/* Add Suggestion Button for empty state */}
            <TouchableOpacity
              onPress={() => router.push(`/event/${eventId}/add-suggestion`)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: BrandColors.peach,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 8,
                marginTop: 24,
              }}
            >
              <Ionicons
                name="add"
                size={20}
                color="#FFFFFF"
              />
              <ThemedText style={{ color: '#FFFFFF', marginLeft: 8, fontSize: 16, fontWeight: '600' }}>
                {t('event.gifts.addFirstSuggestion')}
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Gift Suggestions */}
        {suggestions && suggestions.map((suggestion) => (
          <View
            key={suggestion.id}
            style={{
              backgroundColor: themeColors.surfaceVariant,
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: themeColors.border,
            }}
          >
            {/* Header with Gift Name and Delete Button */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 8,
            }}>
              <ThemedText style={{
                fontSize: 18,
                fontWeight: '600',
                color: themeColors.text,
                flex: 1,
                marginRight: 8,
              }}>
                {isEnglish ? suggestion.name_en : suggestion.name_fr}
              </ThemedText>

              {/* Modify and Delete Buttons - only show if user is the owner */}
              {user && user.id === suggestion.owner_id && (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {/* Modify Button */}
                  <TouchableOpacity
                    onPress={() => handleModifySuggestion(suggestion)}
                    style={{
                      backgroundColor: BrandColors.peach,
                      paddingVertical: 6,
                      paddingHorizontal: 8,
                      borderRadius: 6,
                    }}
                  >
                    <Ionicons name="pencil-outline" size={16} color="#FFFFFF" />
                  </TouchableOpacity>

                  {/* Delete Button */}
                  <TouchableOpacity
                    onPress={() => handleDeleteSuggestion(suggestion.id)}
                    disabled={deletingStates[suggestion.id]}
                    style={{
                      backgroundColor: '#ff6b6b',
                      paddingVertical: 6,
                      paddingHorizontal: 8,
                      borderRadius: 6,
                      opacity: deletingStates[suggestion.id] ? 0.7 : 1,
                    }}
                  >
                    {deletingStates[suggestion.id] ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Category, Price, and View Link Button */}
            <View style={{ flexDirection: 'row', marginBottom: 12, alignItems: 'center' }}>
              <View style={{
                backgroundColor: BrandColors.peach,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 4,
                marginRight: 8,
              }}>
                <ThemedText style={{
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: '600',
                }}>
                  {suggestion.category}
                </ThemedText>
              </View>
              
              {suggestion.price_range && (
                <View style={{
                  backgroundColor: themeColors.background,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 4,
                  borderWidth: 1,
                  borderColor: themeColors.border,
                  marginRight: 8,
                }}>
                  <ThemedText style={{
                    color: themeColors.textSecondary,
                    fontSize: 12,
                    fontWeight: '600',
                  }}>
                    {suggestion.price_range}
                  </ThemedText>
                </View>
              )}
              
              {/* View Gift Icon Button - only show if URL exists and is not empty */}
              {suggestion.url && suggestion.url.trim() !== '' && (
                <TouchableOpacity
                  onPress={() => handleOpenGift(suggestion.url!)}
                  style={{
                    backgroundColor: themeColors.primary,
                    paddingVertical: 4,
                    paddingHorizontal: 8,
                    borderRadius: 4,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="open-outline" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Amazon Affiliate Link Button */}
            {suggestion.amazon_affiliate_url && suggestion.amazon_affiliate_url.trim() !== '' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <TouchableOpacity
                  onPress={() => handleOpenGift(suggestion.amazon_affiliate_url!)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#FF9900',
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 4,
                  }}
                >
                  <Ionicons name="cart-outline" size={14} color="#000000" />
                  <ThemedText style={{ color: '#000000', fontWeight: '600', fontSize: 12, marginLeft: 6 }}>
                    {t('event.gifts.viewOnAmazon')}
                  </ThemedText>
                </TouchableOpacity>
                <ThemedText style={{
                  fontSize: 10,
                  color: themeColors.textSecondary,
                  marginLeft: 8,
                  fontStyle: 'italic'
                }}>
                  {t('event.gifts.affiliateDisclosure')}
                </ThemedText>
              </View>
            )}

            {/* Description */}
            <ThemedText style={{
              color: themeColors.textSecondary,
              fontSize: 14,
              marginBottom: 16,
              lineHeight: 20,
            }}>
              {isEnglish ? suggestion.description_en : suggestion.description_fr}
            </ThemedText>

            {/* Voting Buttons */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/* Upvote Button */}
                <TouchableOpacity
                  onPress={() => handleVote(suggestion.id, 'upvote')}
                  disabled={votingStates[suggestion.id]}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 6,
                    backgroundColor: suggestion.user_vote === 'upvote' 
                      ? BrandColors.peach 
                      : themeColors.background,
                    borderWidth: 1,
                    borderColor: suggestion.user_vote === 'upvote' 
                      ? BrandColors.peach 
                      : themeColors.border,
                    marginRight: 8,
                    opacity: votingStates[suggestion.id] ? 0.7 : 1,
                  }}
                >
                  <Ionicons 
                    name="thumbs-up" 
                    size={16} 
                    color={suggestion.user_vote === 'upvote' ? '#FFFFFF' : themeColors.text} 
                  />
                  <ThemedText style={{
                    fontSize: 14,
                    fontWeight: '600',
                    marginLeft: 4,
                    color: suggestion.user_vote === 'upvote' ? '#FFFFFF' : themeColors.text,
                  }}>
                    {suggestion.upvote_count}
                  </ThemedText>
                </TouchableOpacity>

                {/* Downvote Button */}
                <TouchableOpacity
                  onPress={() => handleVote(suggestion.id, 'downvote')}
                  disabled={votingStates[suggestion.id]}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 6,
                    backgroundColor: suggestion.user_vote === 'downvote' 
                      ? '#ff6b6b' 
                      : themeColors.background,
                    borderWidth: 1,
                    borderColor: suggestion.user_vote === 'downvote' 
                      ? '#ff6b6b' 
                      : themeColors.border,
                    opacity: votingStates[suggestion.id] ? 0.7 : 1,
                  }}
                >
                  <Ionicons 
                    name="thumbs-down" 
                    size={16} 
                    color={suggestion.user_vote === 'downvote' ? '#FFFFFF' : themeColors.text} 
                  />
                  <ThemedText style={{
                    fontSize: 14,
                    fontWeight: '600',
                    marginLeft: 4,
                    color: suggestion.user_vote === 'downvote' ? '#FFFFFF' : themeColors.text,
                  }}>
                    {suggestion.downvote_count}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>

          </View>
        ))}

        {/* Generating More Suggestions Indicator */}
        {isPolling && suggestions && suggestions.length > 0 && suggestions.length < 3 && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            backgroundColor: themeColors.surfaceVariant,
            borderRadius: 8,
            marginBottom: 16,
          }}>
            <ActivityIndicator size="small" color={themeColors.primary} />
            <ThemedText style={{
              marginLeft: 12,
              color: themeColors.textSecondary,
              fontSize: 14,
            }}>
              {t('event.gifts.generatingMore')}
            </ThemedText>
          </View>
        )}

        {/* Add New Suggestion Button - centered below suggestions */}
        {suggestions && suggestions.length > 0 && (
          <View style={{ alignItems: 'center', marginTop: 20, marginBottom: 20 }}>
            <TouchableOpacity
              onPress={() => router.push(`/event/${eventId}/add-suggestion`)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: BrandColors.peach,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 8,
              }}
            >
              <Ionicons
                name="add"
                size={16}
                color="#FFFFFF"
              />
              <ThemedText style={{ color: '#FFFFFF', marginLeft: 8, fontSize: 16, fontWeight: '600' }}>
                {t('event.gifts.addSuggestion')}
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Regenerating State */}
        {regenerating && (
          <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
          }}>
            <ActivityIndicator size="large" color={themeColors.primary} />
            <ThemedText style={{
              fontSize: 16,
              color: themeColors.text,
              marginTop: 16,
              textAlign: 'center',
            }}>
              {t('event.gifts.regeneratingMessage')}
            </ThemedText>
          </View>
        )}
      </View>
    </ScrollView>
  );
};