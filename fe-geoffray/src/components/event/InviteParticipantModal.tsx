import React, {useEffect, useRef, useState} from 'react';
import {Modal, StyleSheet, TextInput, TouchableOpacity, TouchableWithoutFeedback, View, Clipboard, Alert} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useTheme} from '@/src/contexts/ThemeContext';
import {ThemedText} from '@/src/components/ThemedText';
import {ParticipantInviteResponse} from '@/src/api/eventApi';
import {eventStyles} from './EventStyles';
import {Colors} from '@/src/constants/Colors';

interface InviteParticipantModalProps {
  visible: boolean;
  onClose: () => void;
  onInvite: (type: 'email', identifier: string) => Promise<ParticipantInviteResponse>;
}

export const InviteParticipantModal: React.FC<InviteParticipantModalProps> = ({
  visible,
  onClose,
  onInvite
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const themeColors = theme === 'dark' ? Colors.dark : Colors.light;
  
  const [inviteType, setInviteType] = useState<'email'>('email');
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inviteResponse, setInviteResponse] = useState<ParticipantInviteResponse | null>(null);
  const [showSuccessState, setShowSuccessState] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const identifierInputRef = useRef<TextInput>(null);

  // Focus the input when the modal becomes visible
  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        identifierInputRef.current?.focus();
      }, 300);
    }
  }, [visible]);

  // Reset copy success state after 2 seconds
  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => setCopySuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

  const handleInvite = async () => {
    if (!identifier.trim()) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await onInvite(inviteType, identifier.trim());
      setInviteResponse(response);

      // Show success state if invite was successful
      if (response.success) {
        setShowSuccessState(true);
        setIdentifier(''); // Clear the input
      }
    } catch (error) {
      console.error('Error inviting participant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (inviteResponse?.inviteLink) {
      Clipboard.setString(inviteResponse.inviteLink);
      setCopySuccess(true);
    }
  };

  const handleClose = () => {
    setIdentifier('');
    setInviteResponse(null);
    setShowSuccessState(false);
    setCopySuccess(false);
    onClose();
  };

  const handleNewInvite = () => {
    setIdentifier('');
    setInviteResponse(null);
    setShowSuccessState(false);
    setCopySuccess(false);
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
      <TouchableWithoutFeedback onPress={!showSuccessState ? handleClose : undefined}>
        <View style={modalStyles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={[eventStyles.modalContent, { backgroundColor: themeColors.background }]}>
            <ThemedText style={[eventStyles.modalTitle, { color: themeColors.text }]}>
              {showSuccessState ? t('event.inviteSent') : t('event.inviteParticipant')}
            </ThemedText>

            {!showSuccessState ? (
              <>
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
                  placeholder={t('event.enterEmail')}
                  placeholderTextColor={themeColors.textSecondary}
                  value={identifier}
                  onChangeText={setIdentifier}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />

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
              </>
            ) : (
              <>
                {/* Success state */}
                <View
                  style={[
                    eventStyles.responseContainer,
                    {
                      backgroundColor: 'rgba(52, 168, 83, 0.1)',
                      marginBottom: 16
                    }
                  ]}
                >
                  <ThemedText
                    style={[
                      eventStyles.responseText,
                      { color: '#34A853' }
                    ]}
                  >
                    {inviteResponse?.message}
                  </ThemedText>
                </View>

                {/* Show invite link if available */}
                {inviteResponse?.inviteLink && (
                  <>
                    <View style={modalStyles.linkContainer}>
                      <ThemedText style={[modalStyles.linkLabel, { color: themeColors.textSecondary }]}>
                        {t('event.inviteLink')}:
                      </ThemedText>
                      <View style={[modalStyles.linkBox, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                        <ThemedText
                          style={[modalStyles.linkText, { color: themeColors.text }]}
                          numberOfLines={1}
                          ellipsizeMode="middle"
                        >
                          {inviteResponse.inviteLink}
                        </ThemedText>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[modalStyles.copyButton, { backgroundColor: themeColors.primary }]}
                      onPress={handleCopyLink}
                    >
                      <ThemedText style={[modalStyles.copyButtonText, { color: '#FFFFFF' }]}>
                        {copySuccess ? t('event.linkCopied') : t('event.copyInviteLink')}
                      </ThemedText>
                    </TouchableOpacity>
                  </>
                )}

                {/* Action buttons for success state */}
                <View style={eventStyles.modalButtons}>
                  <TouchableOpacity
                    style={[
                      eventStyles.modalButton,
                      { backgroundColor: themeColors.surface }
                    ]}
                    onPress={handleNewInvite}
                  >
                    <ThemedText style={[eventStyles.modalButtonText, { color: themeColors.text }]}>
                      {t('event.inviteAnother')}
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      eventStyles.modalButton,
                      { backgroundColor: themeColors.primary }
                    ]}
                    onPress={handleClose}
                  >
                    <ThemedText style={[eventStyles.modalButtonText, { color: '#FFFFFF' }]}>
                      {t('common.done')}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
  },
  linkContainer: {
    marginBottom: 16,
  },
  linkLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  linkBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  linkText: {
    fontSize: 13,
    fontFamily: 'monospace',
  },
  copyButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  copyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
