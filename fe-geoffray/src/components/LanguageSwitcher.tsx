import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalization } from '@/src/localization/LocalizationContext';

/**
 * A component that allows users to switch between languages
 */
const LanguageSwitcher: React.FC = () => {
  const { t } = useTranslation();
  const { language, changeLanguage } = useLocalization();

  const toggleLanguage = async () => {
    // Toggle between English and French
    const newLanguage = language === 'en' ? 'fr' : 'en';
    await changeLanguage(newLanguage);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.currentLanguage}>
        {t('settings.language')}: {language === 'en' ? t('settings.english') : t('settings.french')}
      </Text>
      <TouchableOpacity style={styles.button} onPress={toggleLanguage}>
        <Text style={styles.buttonText}>
          {language === 'en' ? 'Switch to French' : 'Passer à l\'anglais'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  currentLanguage: {
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default LanguageSwitcher;
