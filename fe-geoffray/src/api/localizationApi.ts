import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiConfig } from './config';
import { getAuthHeader } from './authApi';

// Storage keys
const TRANSLATIONS_STORAGE_KEY = 'rendez_vous_translations';
const TRANSLATIONS_TIMESTAMP_KEY = 'rendez_vous_translations_timestamp';

// Cache expiration time (24 hours in milliseconds)
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

/**
 * Fetch translations from the API for a specific language
 */
export const fetchTranslations = async (languageCode: string): Promise<Record<string, any>> => {
  try {
    // Check if we have cached translations
    const cachedTranslations = await getCachedTranslations(languageCode);
    if (cachedTranslations) {
      return cachedTranslations;
    }

    // If no cached translations or cache expired, fetch from API
    // Note: Translations endpoint doesn't require authentication
    const response = await fetch(`${apiConfig.baseUrl}/api/translations?lang=${languageCode}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch translations: ${response.status}`);
    }

    const translations = await response.json();
    
    // Cache the translations
    await cacheTranslations(languageCode, translations);
    
    return translations;
  } catch (error) {
    console.error('Error fetching translations:', error);
    
    // If API call fails, try to use cached translations even if expired
    const cachedTranslations = await getCachedTranslations(languageCode, true);
    if (cachedTranslations) {
      return cachedTranslations;
    }
    
    // If no cached translations at all, throw error
    throw error;
  }
};

/**
 * Get cached translations if they exist and are not expired
 */
export const getCachedTranslations = async (
  languageCode: string, 
  ignoreExpiration = false
): Promise<Record<string, any> | null> => {
  if (typeof window === 'undefined') {
    return null; // Cannot access AsyncStorage during server-side build
  }
  try {
    // Get cached translations
    const cachedTranslationsJson = await AsyncStorage.getItem(`${TRANSLATIONS_STORAGE_KEY}_${languageCode}`);
    if (!cachedTranslationsJson) {
      return null;
    }

    // Check if cache is expired (unless we're ignoring expiration)
    if (!ignoreExpiration) {
      const timestampJson = await AsyncStorage.getItem(`${TRANSLATIONS_TIMESTAMP_KEY}_${languageCode}`);
      if (timestampJson) {
        const timestamp = JSON.parse(timestampJson);
        const now = Date.now();
        if (now - timestamp > CACHE_EXPIRATION) {
          // Cache expired
          return null;
        }
      }
    }

    return JSON.parse(cachedTranslationsJson);
  } catch (error) {
    console.error('Error getting cached translations:', error);
    return null;
  }
};

/**
 * Cache translations for a specific language
 */
export const cacheTranslations = async (
  languageCode: string, 
  translations: Record<string, any>
): Promise<void> => {
  if (typeof window === 'undefined') {
    console.warn('Cannot cache translations during server-side build.');
    return; // Cannot access AsyncStorage during server-side build
  }
  try {
    await AsyncStorage.setItem(
      `${TRANSLATIONS_STORAGE_KEY}_${languageCode}`, 
      JSON.stringify(translations)
    );
    await AsyncStorage.setItem(
      `${TRANSLATIONS_TIMESTAMP_KEY}_${languageCode}`, 
      JSON.stringify(Date.now())
    );
  } catch (error) {
    console.error('Error caching translations:', error);
  }
};

/**
 * Clear cached translations for a specific language or all languages
 */
export const clearCachedTranslations = async (languageCode?: string): Promise<void> => {
  if (typeof window === 'undefined') {
    console.warn('Cannot clear cached translations during server-side build.');
    return; // Cannot access AsyncStorage during server-side build
  }
  try {
    if (languageCode) {
      // Clear translations for a specific language
      await AsyncStorage.removeItem(`${TRANSLATIONS_STORAGE_KEY}_${languageCode}`);
      await AsyncStorage.removeItem(`${TRANSLATIONS_TIMESTAMP_KEY}_${languageCode}`);
    } else {
      // Clear all translations
      const keys = await AsyncStorage.getAllKeys();
      const translationKeys = keys.filter(key => 
        key.startsWith(TRANSLATIONS_STORAGE_KEY) || 
        key.startsWith(TRANSLATIONS_TIMESTAMP_KEY)
      );
      await AsyncStorage.multiRemove(translationKeys);
    }
  } catch (error) {
    console.error('Error clearing cached translations:', error);
  }
};

/**
 * Set user's preferred language on the server
 */
export const setUserLanguagePreference = async (languageCode: string): Promise<void> => {
  try {
    const authHeader = await getAuthHeader();
    const response = await fetch(`${apiConfig.baseUrl}/api/user/language`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader,
      },
      body: JSON.stringify({ language: languageCode }),
    });

    if (!response.ok) {
      throw new Error(`Failed to set language preference: ${response.status}`);
    }
  } catch (error) {
    console.error('Error setting language preference:', error);
    // We don't throw here because this is a non-critical operation
    // The app will still function with the locally set language
  }
};
