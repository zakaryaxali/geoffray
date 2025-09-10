import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface ThemeModalProps {
  visible: boolean;
  onClose: () => void;
  themePreference: 'light' | 'dark' | 'system';
  onChangeTheme: (theme: 'light' | 'dark' | 'system') => void;
  themeColors: any;
}

export const ThemeModal = ({
  visible,
  onClose,
  themePreference,
  onChangeTheme,
  themeColors,
}: ThemeModalProps) => {
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
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>{t('settings.darkMode')}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={themeColors.text} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[
              styles.modalOption,
              themePreference === 'light' && [styles.selectedOption, { backgroundColor: themeColors.primary + '20' }]
            ]}
            onPress={() => onChangeTheme('light')}
          >
            <View style={styles.modalOptionWithIcon}>
              <Ionicons name="sunny-outline" size={20} color={themeColors.text} style={styles.modalOptionIcon} />
              <Text style={[styles.modalOptionText, { color: themeColors.text }]}>{t('settings.lightEnabled')}</Text>
            </View>
            {themePreference === 'light' && (
              <Ionicons name="checkmark" size={20} color={themeColors.primary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modalOption,
              themePreference === 'dark' && [styles.selectedOption, { backgroundColor: themeColors.primary + '20' }]
            ]}
            onPress={() => onChangeTheme('dark')}
          >
            <View style={styles.modalOptionWithIcon}>
              <Ionicons name="moon-outline" size={20} color={themeColors.text} style={styles.modalOptionIcon} />
              <Text style={[styles.modalOptionText, { color: themeColors.text }]}>{t('settings.darkEnabled')}</Text>
            </View>
            {themePreference === 'dark' && (
              <Ionicons name="checkmark" size={20} color={themeColors.primary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modalOption,
              themePreference === 'system' && [styles.selectedOption, { backgroundColor: themeColors.primary + '20' }]
            ]}
            onPress={() => onChangeTheme('system')}
          >
            <View style={styles.modalOptionWithIcon}>
              <Ionicons name="settings-outline" size={20} color={themeColors.text} style={styles.modalOptionIcon} />
              <Text style={[styles.modalOptionText, { color: themeColors.text }]}>{t('settings.systemDefault')}</Text>
            </View>
            {themePreference === 'system' && (
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
  modalOptionWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalOptionIcon: {
    marginRight: 10,
  },
  modalOptionText: {
    fontSize: 16,
  },
});
