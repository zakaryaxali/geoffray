import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchTranslations } from '@/src/api/localizationApi';

// Define the shape of our translations
export interface TranslationMap {
  [key: string]: string;
}

// Define the shape of our context
interface LocalizationContextType {
  translations: TranslationMap;
  language: string;
  setLanguage: (language: string) => Promise<void>;
  isLoading: boolean;
  translate: (key: string, defaultValue?: string) => string;
}

// Create the context with a default value
const LocalizationContext = createContext<LocalizationContextType>({
  translations: {},
  language: 'en',
  setLanguage: async () => {},
  isLoading: true,
  translate: (key: string, defaultValue?: string) => defaultValue || key,
});

// Storage key for the user's preferred language
const LANGUAGE_STORAGE_KEY = 'rendez_vous_language';

// Available languages
export const SUPPORTED_LANGUAGES = ['en', 'fr'];

// Provider component
export const LocalizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [translations, setTranslations] = useState<TranslationMap>({});
  const [language, setLanguageState] = useState<string>('en');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Function to load translations for a specific language
  const loadTranslations = async (languageCode: string) => {
    try {
      setIsLoading(true);
      const data = await fetchTranslations(languageCode);
      
      // The API returns a structure with LanguageCode and Translations
      // We need to extract the actual translations map
      if (data && data.translations) {
        setTranslations(data.translations);
      } else {
        console.error('Invalid translation data format:', data);
        setTranslations({});
      }
    } catch (error) {
      console.error('Failed to load translations:', error);
      setTranslations({});
    } finally {
      setIsLoading(false);
    }
  };

  // Function to set the language and save it to storage
  const setLanguage = async (languageCode: string) => {
    if (!SUPPORTED_LANGUAGES.includes(languageCode)) {
      languageCode = 'en'; // Fallback to English
    }
    
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
      setLanguageState(languageCode);
      await loadTranslations(languageCode);
    } catch (error) {
      console.error('Failed to set language:', error);
    }
  };

  // Function to translate a key
  const translate = (key: string, defaultValue?: string): string => {
    if (!key) return defaultValue || '';
    return translations[key] || defaultValue || key;
  };

  // Initialize language on component mount
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        // Try to get the saved language from storage
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        
        if (savedLanguage && SUPPORTED_LANGUAGES.includes(savedLanguage)) {
          // Use saved language if it exists and is supported
          setLanguageState(savedLanguage);
          await loadTranslations(savedLanguage);
        } else {
          // Otherwise, detect device language
          const deviceLanguage = Localization.locale.split('-')[0];
          const languageToUse = SUPPORTED_LANGUAGES.includes(deviceLanguage) 
            ? deviceLanguage 
            : 'en'; // Default to English if device language not supported
          
          setLanguageState(languageToUse);
          await loadTranslations(languageToUse);
          
          // Save the detected language for future use
          await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageToUse);
        }
      } catch (error) {
        console.error('Error initializing language:', error);
        // Fallback to English on error
        setLanguageState('en');
        await loadTranslations('en');
      } finally {
        setIsLoading(false);
      }
    };

    initializeLanguage();
  }, []);

  return (
    <LocalizationContext.Provider
      value={{
        translations,
        language,
        setLanguage,
        isLoading,
        translate,
      }}
    >
      {children}
    </LocalizationContext.Provider>
  );
};

// Custom hook to use the localization context
export const useLocalization = () => useContext(LocalizationContext);
