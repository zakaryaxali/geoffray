import React, {useEffect, useRef, useState} from 'react';
import {Linking, Modal, StyleSheet, TextInput, TouchableOpacity, TouchableWithoutFeedback, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useTheme} from '@/src/contexts/ThemeContext';
import {ThemedText} from '@/src/components/ThemedText';
import {ParticipantInviteResponse} from '@/src/api/eventApi';
import {eventStyles} from './EventStyles';
import {Colors} from '@/src/constants/Colors';

interface InviteParticipantModalProps {
  visible: boolean;
  onClose: () => void;
  onInvite: (type: 'email' | 'phone', identifier: string) => Promise<ParticipantInviteResponse>;
}

export const InviteParticipantModal: React.FC<InviteParticipantModalProps> = ({
  visible,
  onClose,
  onInvite
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const themeColors = theme === 'dark' ? Colors.dark : Colors.light;
  
  const [inviteType, setInviteType] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inviteResponse, setInviteResponse] = useState<ParticipantInviteResponse | null>(null);
  const identifierInputRef = useRef<TextInput>(null);

  // Focus the input when the modal becomes visible
  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        identifierInputRef.current?.focus();
      }, 300);
    }
  }, [visible]);

  const handleInvite = async () => {
    if (!identifier.trim()) {
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await onInvite(inviteType, identifier.trim());
      setInviteResponse(response);
    } catch (error) {
      console.error('Error inviting participant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIdentifier('');
    setInviteResponse(null);
    onClose();
  };

  const handleTabChange = (type: 'email' | 'phone') => {
    setInviteType(type);
    setIdentifier('');
    setInviteResponse(null);
    setTimeout(() => {
      identifierInputRef.current?.focus();
    }, 100);
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={modalStyles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={[eventStyles.modalContent, { backgroundColor: themeColors.background }]}>
            <ThemedText style={[eventStyles.modalTitle, { color: themeColors.text }]}>
              {t('event.inviteParticipant')}
            </ThemedText>
            
            {/* Tab buttons for email/phone */}
            <View style={eventStyles.tabButtons}>
              <TouchableOpacity 
                style={[
                  eventStyles.tabButton, 
                  { 
                    backgroundColor: inviteType === 'email' 
                      ? themeColors.primary 
                      : themeColors.surface 
                  }
                ]}
                onPress={() => handleTabChange('email')}
              >
                <ThemedText 
                  style={[
                    eventStyles.tabButtonText, 
                    { color: inviteType === 'email' ? '#FFFFFF' : themeColors.text }
                  ]}
                >
                  {t('event.email')}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  eventStyles.tabButton, 
                  { 
                    backgroundColor: inviteType === 'phone' 
                      ? themeColors.primary 
                      : themeColors.surface,
                    marginLeft: 8
                  }
                ]}
                onPress={() => handleTabChange('phone')}
              >
                <ThemedText 
                  style={[
                    eventStyles.tabButtonText, 
                    { color: inviteType === 'phone' ? '#FFFFFF' : themeColors.text }
                  ]}
                >
                  {t('event.phone')}
                </ThemedText>
              </TouchableOpacity>
            </View>
            
            {/* Input field */}
            <TextInput
              ref={identifierInputRef}
              style={[
                eventStyles.input, 
                { 
                  borderColor: themeColors.border,
                  color: themeColors.text,
                  backgroundColor: themeColors.surface
                }
              ]}
              placeholder={inviteType === 'email' ? t('event.enterEmail') : t('event.enterPhone')}
              placeholderTextColor={themeColors.textSecondary}
              value={identifier}
              onChangeText={setIdentifier}
              keyboardType={inviteType === 'email' ? 'email-address' : 'phone-pad'}
              autoCapitalize="none"
              editable={!isLoading}
            />
            
            {/* Response message */}
            {inviteResponse && (
              <View 
                style={[
                  eventStyles.responseContainer, 
                  { 
                    backgroundColor: inviteResponse.success 
                      ? 'rgba(52, 168, 83, 0.1)' 
                      : 'rgba(234, 67, 53, 0.1)' 
                  }
                ]}
              >
                <ThemedText 
                  style={[
                    eventStyles.responseText, 
                    { 
                      color: inviteResponse.success 
                        ? '#34A853' 
                        : '#EA4335' 
                    }
                  ]}
                >
                  {inviteResponse.message}
                </ThemedText>
                
                {inviteResponse.inviteLink && (
                  <TouchableOpacity onPress={() => Linking.openURL(inviteResponse.inviteLink || '')}>
                    <ThemedText 
                      style={[
                        eventStyles.linkText, 
                        { color: themeColors.primary, marginTop: 8 }
                      ]}
                    >
                      {t('event.copyInviteLink')}
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            )}
            
            {/* Action buttons */}
            <View style={eventStyles.modalButtons}>
              <TouchableOpacity 
                style={[
                  eventStyles.modalButton, 
                  { backgroundColor: themeColors.surface }
                ]}
                onPress={handleClose}
                disabled={isLoading}
              >
                <ThemedText style={[eventStyles.modalButtonText, { color: themeColors.text }]}>
                  {t('common.cancel')}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  eventStyles.modalButton, 
                  { 
                    backgroundColor: themeColors.primary,
                    opacity: isLoading || !identifier.trim() ? 0.5 : 1
                  }
                ]}
                onPress={handleInvite}
                disabled={isLoading || !identifier.trim()}
              >
                <ThemedText style={[eventStyles.modalButtonText, { color: '#FFFFFF' }]}>
                  {isLoading ? t('common.loading') : t('event.invite')}
                </ThemedText>
              </TouchableOpacity>
            </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  }
});
