import React, { useState } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/src/contexts/ThemeContext';
import { ThemedText } from '@/src/components/ThemedText';
import { Colors } from '@/src/constants/Colors';
import { eventApi } from '@/src/api/eventApi';
import { mapParticipantStatus } from './EventUtils';

interface StatusChangeModalProps {
  visible: boolean;
  onClose: () => void;
  eventId: string;
  currentStatus: 'going' | 'pending' | 'not_going';
  onStatusChanged: (newStatus: 'going' | 'pending' | 'not_going') => void;
}

export const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
  visible,
  onClose,
  eventId,
  currentStatus,
  onStatusChanged,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const themeColors = theme === 'dark' ? Colors.dark : Colors.light;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: 'going' | 'pending' | 'not_going') => {
    if (newStatus === currentStatus) {
      onClose();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Convert frontend status to backend status
      const backendStatus = mapParticipantStatus(newStatus);
      
      // Call the API to update status
      await eventApi.updateParticipantStatus(eventId, { status: backendStatus });
      
      // Update the UI
      onStatusChanged(newStatus);
      onClose();
    } catch (err) {
      console.error('Failed to update status:', err);
      setError(t('event.statusUpdateError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={[styles.centeredView]}>
        <View style={[styles.modalView, { backgroundColor: themeColors.background }]}>
          <ThemedText style={styles.modalTitle}>{t('event.updateStatus')}</ThemedText>
          
          {error && (
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          )}

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.option,
                { backgroundColor: 'rgba(52, 168, 83, 0.15)' },
                currentStatus === 'going' && styles.selectedOption
              ]}
              onPress={() => handleStatusChange('going')}
              disabled={isLoading}
            >
              <ThemedText style={[styles.optionText, { color: '#34A853' }]}>
                {t('event.status.going')}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.option,
                { backgroundColor: 'rgba(251, 188, 5, 0.15)' },
                currentStatus === 'pending' && styles.selectedOption
              ]}
              onPress={() => handleStatusChange('pending')}
              disabled={isLoading}
            >
              <ThemedText style={[styles.optionText, { color: '#FBBC05' }]}>
                {t('event.status.pending')}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.option,
                { backgroundColor: 'rgba(234, 67, 53, 0.15)' },
                currentStatus === 'not_going' && styles.selectedOption
              ]}
              onPress={() => handleStatusChange('not_going')}
              disabled={isLoading}
            >
              <ThemedText style={[styles.optionText, { color: '#EA4335' }]}>
                {t('event.status.notGoing')}
              </ThemedText>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator size="small" color={themeColors.primary} style={styles.loader} />
          ) : (
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: themeColors.border }]}
              onPress={onClose}
            >
              <ThemedText>{t('common.cancel')}</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '80%',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  optionsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  option: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  selectedOption: {
    borderWidth: 2,
    borderColor: '#000',
  },
  optionText: {
    fontWeight: '600',
  },
  cancelButton: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    width: '100%',
    alignItems: 'center',
  },
  errorText: {
    color: '#EA4335',
    marginBottom: 15,
    textAlign: 'center',
  },
  loader: {
    marginVertical: 10,
  },
});
