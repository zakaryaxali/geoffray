import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { getStoredLanguage, setLanguagePreference } from './i18n';

// Define the context type
type LocalizationContextType = {
  language: string;
  changeLanguage: (language: string) => Promise<void>;
  isRTL: boolean;
};

// Create the context
const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

// Provider component
export const LocalizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState<string>(i18n.language || 'en');
  const [isRTL, setIsRTL] = useState<boolean>(false);

  // Initialize language from storage on component mount
  useEffect(() => {
    const initLanguage = async () => {
      const storedLanguage = await getStoredLanguage();
      if (storedLanguage) {
        setLanguage(storedLanguage);
      }
    };

    initLanguage();
  }, []);

  // Update RTL status when language changes
  useEffect(() => {
    // Add RTL languages here if needed in the future
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    setIsRTL(rtlLanguages.includes(language));
  }, [language]);

  // Handle language change
  const handleChangeLanguage = async (newLanguage: string): Promise<void> => {
    try {
      await setLanguagePreference(newLanguage);
      setLanguage(newLanguage);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  return (
    <LocalizationContext.Provider
      value={{
        language,
        changeLanguage: handleChangeLanguage,
        isRTL
      }}
    >
      {children}
    </LocalizationContext.Provider>
  );
};

// Custom hook to use the localization context
export const useLocalization = (): LocalizationContextType => {
  const context = useContext(LocalizationContext);
  if (context === undefined) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};
