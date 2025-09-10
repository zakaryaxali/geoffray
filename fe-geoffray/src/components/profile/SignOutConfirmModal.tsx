import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { BrandColors } from '@/src/constants/Colors';

interface SignOutConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  themeColors: any;
}

export const SignOutConfirmModal = ({
  visible,
  onClose,
  onConfirm,
  themeColors,
}: SignOutConfirmModalProps) => {
  const { t } = useTranslation();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: themeColors.modalBackground }]}>
        <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>{t('profile.signOut')}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={themeColors.text} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.modalText, { color: themeColors.text }]}>
            {t('profile.signOutConfirmation')}
          </Text>
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton, { borderColor: themeColors.border }]} 
              onPress={onClose}
            >
              <Text style={[styles.modalButtonText, { color: themeColors.text }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.confirmButton, { backgroundColor: BrandColors.coral }]} 
              onPress={onConfirm}
            >
              <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>{t('common.confirm')}</Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    // Uses themeColors.error for background color
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
