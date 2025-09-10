import { useLocalization } from '@/src/contexts/LocalizationContext';

/**
 * Custom hook for using translations throughout the app
 * 
 * @returns {Object} Translation utilities
 */
export const useTranslation = () => {
  const { translate, language, setLanguage, isLoading } = useLocalization();
  
  /**
   * Translate a key with optional interpolation
   * 
   * @param {string} key - Translation key
   * @param {Object} params - Optional parameters for interpolation
   * @param {string} defaultValue - Fallback if key is not found
   * @returns {string} Translated text
   */
  const t = (key: string, params?: Record<string, string | number>, defaultValue?: string): string => {
    let translated = translate(key, defaultValue);
    
    // Simple interpolation
    if (params && translated) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translated = translated.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue));
      });
    }
    
    return translated;
  };
  
  return {
    t,
    language,
    setLanguage,
    isLoading
  };
};
