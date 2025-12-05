import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  View,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText as Text } from '@/src/components/ThemedText';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/src/api/apiClient';
import { Colors } from '@/src/constants/Colors';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function AddGiftSuggestionScreen() {
  const { id, edit_id, mode: editMode, name: editName, description: editDesc,
          priceRange: editPrice, category: editCategory, url: editUrl, prompt: editPrompt } = useLocalSearchParams<{
    id: string;
    edit_id?: string;
    mode?: string;
    name?: string;
    description?: string;
    priceRange?: string;
    category?: string;
    url?: string;
    prompt?: string;
  }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useTheme();
  const themeColors = theme === 'dark' ? Colors.dark : Colors.light;

  const [mode, setMode] = useState<'manual' | 'ai'>('ai');
  const [isLoading, setIsLoading] = useState(false);

  // Manual mode fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [category, setCategory] = useState('');
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');

  // AI mode field
  const [prompt, setPrompt] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState(''); // Track original prompt to detect changes

  // Pre-fill form if editing
  useEffect(() => {
    if (edit_id && typeof edit_id === 'string') {
      // Edit mode - pre-fill form
      setMode((editMode as 'manual' | 'ai') || 'manual');
      setName((editName as string) || '');
      setDescription((editDesc as string) || '');
      setPriceRange((editPrice as string) || '');
      setCategory((editCategory as string) || '');
      setUrl((editUrl as string) || '');
      setPrompt((editPrompt as string) || '');
      setOriginalPrompt((editPrompt as string) || ''); // Store original for comparison
    }
  }, [edit_id, editMode, editName, editDesc, editPrice, editCategory, editUrl, editPrompt]);

  const handleSubmit = async () => {
    if (mode === 'manual') {
      // Validate required fields
      if (!name.trim()) {
        Alert.alert(t('error'), t('giftSuggestion.nameRequired'));
        return;
      }
      if (!priceRange) {
        Alert.alert(t('error'), t('giftSuggestion.priceRequired'));
        return;
      }
    } else {
      // Validate AI mode
      if (!prompt) {
        Alert.alert(t('error'), t('giftSuggestion.promptRequired'));
        return;
      }
    }

    setIsLoading(true);
    try {
      const requestData: any = {
        event_id: id,
        mode,
      };

      if (mode === 'manual') {
        // Determine current language and populate the appropriate field
        const currentLanguage = t('language'); // 'en' or 'fr'
        if (currentLanguage === 'fr') {
          requestData.name_fr = name;
          requestData.description_fr = description;
        } else {
          requestData.name_en = name;
          requestData.description_en = description;
        }
        requestData.price_range = priceRange;
        requestData.category = category;
        requestData.url = url;
      } else {
        requestData.prompt = prompt;
        requestData.language = t('language');
      }

      if (edit_id && typeof edit_id === 'string') {
        // UPDATE existing suggestion
        // For updates, we need to include all fields (even in AI mode)
        // to preserve the existing suggestion content
        const currentLanguage = t('language');

        // Detect if prompt changed - if yes, trigger AI regeneration
        const promptChanged = mode === 'ai' && prompt !== originalPrompt;

        const updateData: any = {
          name_en: mode === 'ai' && edit_id ? name : requestData.name_en || '',
          name_fr: mode === 'ai' && edit_id ? name : requestData.name_fr || '',
          description_en: mode === 'ai' && edit_id ? description : requestData.description_en || '',
          description_fr: mode === 'ai' && edit_id ? description : requestData.description_fr || '',
          price_range: mode === 'ai' && edit_id ? priceRange : requestData.price_range,
          category: mode === 'ai' && edit_id ? category : requestData.category,
          url: mode === 'ai' && edit_id ? url : requestData.url || '',
          creation_mode: mode,
          regenerate_with_ai: promptChanged, // Smart detection: regenerate if prompt changed
        };

        // Include prompt if available (for AI mode)
        if (mode === 'ai' && prompt) {
          updateData.prompt = prompt;
        }

        // Add language for AI regeneration
        if (promptChanged) {
          updateData.language = currentLanguage;
        }

        await apiClient.put(`/api/gift-suggestions/${edit_id}`, updateData);

        router.push(`/event/${id}?tab=gifts`);
        setTimeout(() => {
          Alert.alert(
            t('success'),
            t('giftSuggestion.updatedSuccess')
          );
        }, 100);
      } else {
        // CREATE new suggestion
        const response = await apiClient.post('/api/gift-suggestions', requestData);

        // Success! Navigate to event page gifts tab and show success message
        router.push(`/event/${id}?tab=gifts`);

        // Show success alert after navigation (works better on web)
        setTimeout(() => {
          Alert.alert(
            t('success'),
            t('giftSuggestion.addedSuccess')
          );
        }, 100);
      }
    } catch (error: any) {
      console.error('Error creating gift suggestion:', error);
      Alert.alert(
        t('error'),
        error.response?.data?.error || t('giftSuggestion.addError')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Mode Toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              mode === 'ai' && { backgroundColor: themeColors.primary },
            ]}
            onPress={() => setMode('ai')}
          >
            <Ionicons
              name="sparkles-outline"
              size={20}
              color={mode === 'ai' ? '#FFFFFF' : themeColors.text}
            />
            <Text
              style={[
                styles.modeButtonText,
                mode === 'ai' && { color: '#FFFFFF' },
              ]}
            >
              {t('giftSuggestion.aiMode')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeButton,
              mode === 'manual' && { backgroundColor: themeColors.primary },
            ]}
            onPress={() => setMode('manual')}
          >
            <Ionicons
              name="create-outline"
              size={20}
              color={mode === 'manual' ? '#FFFFFF' : themeColors.text}
            />
            <Text
              style={[
                styles.modeButtonText,
                mode === 'manual' && { color: '#FFFFFF' },
              ]}
            >
              {t('giftSuggestion.manualMode')}
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'manual' ? (
          <View style={styles.formContainer}>
            {/* Name Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('giftSuggestion.name')} *</Text>
              <TextInput
                style={[styles.input, { color: themeColors.text, borderColor: themeColors.border }]}
                value={name}
                onChangeText={setName}
                placeholder={t('giftSuggestion.namePlaceholder')}
                placeholderTextColor={themeColors.tabIconDefault}
              />
            </View>

            {/* Description Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('giftSuggestion.description')}</Text>
              <TextInput
                style={[styles.textArea, { color: themeColors.text, borderColor: themeColors.border }]}
                value={description}
                onChangeText={setDescription}
                placeholder={t('giftSuggestion.descriptionPlaceholder')}
                placeholderTextColor={themeColors.tabIconDefault}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Price Range */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('giftSuggestion.priceRange')} *</Text>
              <TextInput
                style={[styles.input, { color: themeColors.text, borderColor: themeColors.border }]}
                value={priceRange}
                onChangeText={setPriceRange}
                placeholder={t('giftSuggestion.priceRangePlaceholder')}
                placeholderTextColor={themeColors.tabIconDefault}
              />
            </View>

            {/* Category */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('giftSuggestion.category')}</Text>
              <TextInput
                style={[styles.input, { color: themeColors.text, borderColor: themeColors.border }]}
                value={category}
                onChangeText={setCategory}
                placeholder={t('giftSuggestion.categoryPlaceholder')}
                placeholderTextColor={themeColors.tabIconDefault}
              />
            </View>

            {/* URL */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                {t('giftSuggestion.url')} 
                <Text style={styles.optionalLabel}> ({t('optional')})</Text>
              </Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    color: themeColors.text, 
                    borderColor: urlError ? '#FF3B30' : themeColors.border 
                  }
                ]}
                value={url}
                onChangeText={(text) => {
                  setUrl(text);
                  setUrlError(''); // Clear error on change
                }}
                placeholder={t('giftSuggestion.urlPlaceholder')}
                placeholderTextColor={themeColors.tabIconDefault}
                autoCapitalize="none"
                keyboardType="url"
              />
              {urlError ? (
                <Text style={styles.errorText}>{urlError}</Text>
              ) : (
                <Text style={styles.helpText}>
                  {t('giftSuggestion.urlHelp')}
                </Text>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.formContainer}>
            <Text style={styles.aiDescription}>
              {t('giftSuggestion.aiDescription')}
            </Text>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('giftSuggestion.prompt')} *</Text>
              <TextInput
                style={[styles.textArea, { color: themeColors.text, borderColor: themeColors.border }]}
                value={prompt}
                onChangeText={setPrompt}
                placeholder={t('giftSuggestion.promptPlaceholder')}
                placeholderTextColor={themeColors.tabIconDefault}
                multiline
                numberOfLines={5}
              />
            </View>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: themeColors.primary },
            isLoading && styles.disabledButton,
          ]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons
                name={mode === 'ai' ? 'sparkles' : (edit_id ? 'save' : 'add-circle')}
                size={24}
                color="#FFFFFF"
                style={styles.submitIcon}
              />
              <Text style={styles.submitButtonText}>
                {edit_id
                  ? t('giftSuggestion.updateSuggestion')
                  : mode === 'ai'
                    ? t('giftSuggestion.generateSuggestion')
                    : t('giftSuggestion.addSuggestion')}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: themeColors.border }]}
          onPress={() => router.push(`/event/${id}?tab=gifts`)}
        >
          <Text style={[styles.cancelButtonText, { color: themeColors.text }]}>
            {t('common.cancel')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  modeToggle: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  formContainer: {
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  aiDescription: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
    opacity: 0.8,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  submitIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  optionalLabel: {
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
});