import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { fetchTranslations } from '@/src/api/localizationApi';

// Import local translations as fallback
import en from './translations/en.json';
import fr from './translations/fr.json';

// Storage key for language preference
const LANGUAGE_STORAGE_KEY = 'rendez_vous_language';
const TRANSLATIONS_CACHE_KEY = 'rendez_vous_translations_cache';

// Initial resources object with our local translations as fallback
const resources = {
  en: {
    translation: en
  },
  fr: {
    translation: fr
  }
};

// Define supported languages
const supportedLanguages = ['en', 'fr'];

// Helper to get the device language
const getDeviceLanguage = (): string => {
  try {
    // Get the device locale (e.g., 'en-US', 'fr-FR')
    const locale = Localization.locale;
    
    // Check if locale is defined before trying to split it
    if (!locale) {
      console.warn('Device locale is undefined, falling back to default language');
      return 'en';
    }
    
    // Extract the language code (e.g., 'en', 'fr')
    const languageCode = locale.split('-')[0];
    // Return the language code if it's supported, otherwise default to 'en'
    return supportedLanguages.includes(languageCode) ? languageCode : 'en';
  } catch (error) {
    console.error('Error getting device language:', error);
    return 'en'; // Default to English on error
  }
};

// Helper to get the stored language preference
export const getStoredLanguage = async (): Promise<string | null> => {
  if (typeof window === 'undefined') {
    return null; // Cannot access AsyncStorage during server-side build
  }
  try {
    return await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch (error) {
    console.error('Error getting stored language:', error);
    return null;
  }
};

// Helper to set the language preference
export const setLanguagePreference = async (language: string): Promise<void> => {
  if (typeof window === 'undefined') {
    console.warn('Cannot set language preference during server-side build.');
    return; // Cannot access AsyncStorage during server-side build
  }
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    await changeLanguage(language);
  } catch (error) {
    console.error('Error setting language preference:', error);
  }
};

// Helper to change the language
export const changeLanguage = async (language: string): Promise<void> => {
  // First change the language with what we have
  await i18n.changeLanguage(language);
  
  // Then try to fetch updated translations from the API
  await fetchTranslationsFromAPI(language);
};

// Fetch translations from the API
const fetchTranslationsFromAPI = async (language: string): Promise<void> => {
  try {
    console.log(`Fetching translations for ${language} from API...`);
    const data = await fetchTranslations(language);
    
    if (data && data.translations) {
      // Update the resources with the fetched translations
      i18n.addResourceBundle(language, 'translation', data.translations, true, true);
      
      // Cache the translations only on client-side
      if (typeof window !== 'undefined') {
        await AsyncStorage.setItem(
          `${TRANSLATIONS_CACHE_KEY}_${language}`,
          JSON.stringify(data.translations)
        );
      }
      
      console.log(`Translations for ${language} loaded from API successfully`);
    }
  } catch (error) {
    console.error(`Failed to fetch translations for ${language} from API:`, error);
    // We'll fall back to local translations in this case
  }
};

// Initialize i18next
const initI18n = async (): Promise<void> => {
  // Try to get the stored language preference (will return null during build)
  const storedLanguage = await getStoredLanguage();
  // Determine initial language based on storage or device (defaults handled within helpers)
  const initialLanguage = storedLanguage || getDeviceLanguage();
  
  // Initialize i18next with local translations first
  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: initialLanguage,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false // React already escapes values
      },
      compatibilityJSON: 'v4' // Updated to v4 for compatibility
    });
  
  // Then try to fetch translations from the API
  await fetchTranslationsFromAPI(initialLanguage);
};

// Export the initialization function
export default initI18n;
