import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface LanguageModalProps {
  visible: boolean;
  onClose: () => void;
  language: string;
  onChangeLanguage: (language: string) => void;
  themeColors: any;
}

export const LanguageModal = ({
  visible,
  onClose,
  language,
  onChangeLanguage,
  themeColors,
}: LanguageModalProps) => {
  const { t } = useTranslation();

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: themeColors.modalBackground }]}>
        <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>{t('settings.language')}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={themeColors.text} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[
              styles.modalOption,
              language === 'en' && [styles.selectedOption, { backgroundColor: themeColors.primary + '20' }]
            ]}
            onPress={() => onChangeLanguage('en')}
          >
            <Text style={[styles.modalOptionText, { color: themeColors.text }]}>{t('settings.english')}</Text>
            {language === 'en' && (
              <Ionicons name="checkmark" size={20} color={themeColors.primary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modalOption,
              language === 'fr' && [styles.selectedOption, { backgroundColor: themeColors.primary + '20' }]
            ]}
            onPress={() => onChangeLanguage('fr')}
          >
            <Text style={[styles.modalOptionText, { color: themeColors.text }]}>{t('settings.french')}</Text>
            {language === 'fr' && (
              <Ionicons name="checkmark" size={20} color={themeColors.primary} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  selectedOption: {
    borderRadius: 8,
  },
  modalOptionText: {
    fontSize: 16,
  },
});
