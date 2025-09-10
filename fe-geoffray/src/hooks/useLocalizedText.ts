import { useTranslation } from 'react-i18next';
import { useLocalization } from '@/src/localization/LocalizationContext';

/**
 * Custom hook to simplify access to localized text and language functions
 * 
 * @returns Object containing translation function, current language, and language change function
 */
export const useLocalizedText = () => {
  const { t } = useTranslation();
  const { language, changeLanguage, isRTL } = useLocalization();

  return {
    t,
    language,
    changeLanguage,
    isRTL
  };
};

export default useLocalizedText;
