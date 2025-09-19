import React, { useState, useEffect } from 'react';
import { ScrollView, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/src/components/ThemedText';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Colors, BrandColors } from '@/src/constants/Colors';
import { eventStyles } from './EventStyles';
import { apiClient } from '@/src/api/apiClient';

interface GiftSuggestion {
  id: string;
  event_id: string;
  name_en: string;
  name_fr: string;
  description_en: string;
  description_fr: string;
  price_range: string;
  category: string;
  url?: string;
  generated_at: string;
  created_at: string;
  updated_at: string;
}

interface EventGiftsProps {
  eventId: string;
  isCreator: boolean;
}

export const EventGifts: React.FC<EventGiftsProps> = ({ eventId, isCreator }) => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const themeColors = theme === 'dark' ? Colors.dark : Colors.light;
  
  const [suggestions, setSuggestions] = useState<GiftSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
  const handleOpenGift = (url: string) => {
    if (url) {
      // In a real app, you would use Linking.openURL(url)
      console.log('Opening gift URL:', url);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchGiftSuggestions();
    }
  }, [eventId]);

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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <ThemedText style={{ fontSize: 24, fontWeight: 'bold', color: themeColors.text }}>
            {t('event.gifts.title')}
          </ThemedText>
          
          {isCreator && (
            <TouchableOpacity
              onPress={handleRegenerateGifts}
              disabled={regenerating}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: BrandColors.peach,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                opacity: regenerating ? 0.7 : 1,
              }}
            >
              {regenerating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons 
                  name={suggestions && suggestions.length > 0 ? "refresh" : "sparkles"} 
                  size={16} 
                  color="#FFFFFF" 
                />
              )}
              <ThemedText style={{ color: '#FFFFFF', marginLeft: 6, fontSize: 14, fontWeight: '600' }}>
                {suggestions && suggestions.length > 0 
                  ? t('event.gifts.regenerate') 
                  : t('event.gifts.generate')
                }
              </ThemedText>
            </TouchableOpacity>
          )}
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
            {/* Gift Name */}
            <ThemedText style={{
              fontSize: 18,
              fontWeight: '600',
              color: themeColors.text,
              marginBottom: 8,
            }}>
              {isEnglish ? suggestion.name_en : suggestion.name_fr}
            </ThemedText>

            {/* Category and Price */}
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
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
            </View>

            {/* Description */}
            <ThemedText style={{
              color: themeColors.textSecondary,
              fontSize: 14,
              marginBottom: 16,
              lineHeight: 20,
            }}>
              {isEnglish ? suggestion.description_en : suggestion.description_fr}
            </ThemedText>

            {/* Action Button */}
            {suggestion.url && (
              <TouchableOpacity
                onPress={() => handleOpenGift(suggestion.url!)}
                style={{
                  backgroundColor: themeColors.primary,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="open-outline" size={16} color="#FFFFFF" />
                <ThemedText style={{
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: '600',
                  marginLeft: 8,
                }}>
                  {t('event.gifts.viewGift')}
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        ))}

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