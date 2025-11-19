import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { ThemedText } from '@/src/components/ThemedText';
import { PendingInvitation } from '@/src/api/eventApi';
import { useTheme } from '@/src/contexts/ThemeContext';
import { Colors } from '@/src/constants/Colors';

interface PendingInvitationsProps {
  invitations: PendingInvitation[];
  onRescind?: (email: string) => void;
  onCopyInviteLink?: (email: string) => Promise<string | null>;
}

export const PendingInvitations: React.FC<PendingInvitationsProps> = ({ invitations, onRescind, onCopyInviteLink }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const themeColors = theme === 'dark' ? Colors.dark : Colors.light;
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  if (invitations.length === 0) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleCopyInviteLink = async (email: string) => {
    if (onCopyInviteLink) {
      const inviteLink = await onCopyInviteLink(email);
      if (inviteLink) {
        await Clipboard.setStringAsync(inviteLink);
        setCopiedEmail(email);
        setTimeout(() => setCopiedEmail(null), 2000);
      }
    }
  };

  return (
    <View style={styles.container}>
      <ThemedText style={[styles.sectionTitle, { color: themeColors.text }]}>
        {t('event.pendingInvitations')} ({invitations.length})
      </ThemedText>

      {invitations.map((invitation, index) => {
        const identifier = invitation.email || invitation.phone || '';

        return (
          <View
            key={index}
            style={[
              styles.invitationCard,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
              },
            ]}
          >
            <View style={styles.invitationInfo}>
              <ThemedText style={[styles.identifier, { color: themeColors.text }]}>
                {identifier}
              </ThemedText>
              <ThemedText style={[styles.metadata, { color: themeColors.textSecondary }]}>
                {t('event.invitedOn')} {formatDate(invitation.invitedAt)}
              </ThemedText>
            </View>

            <View style={styles.actions}>
              {onCopyInviteLink && (
                <TouchableOpacity
                  style={[styles.actionButton, { borderColor: themeColors.border }]}
                  onPress={() => handleCopyInviteLink(identifier)}
                >
                  <Ionicons
                    name={copiedEmail === identifier ? "checkmark" : "copy-outline"}
                    size={20}
                    color={copiedEmail === identifier ? "#34A853" : themeColors.primary}
                  />
                </TouchableOpacity>
              )}

              {onRescind && (
                <TouchableOpacity
                  style={[styles.actionButton, { borderColor: themeColors.border }]}
                  onPress={() => onRescind(identifier)}
                >
                  <Ionicons name="close-circle-outline" size={20} color="#EA4335" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  invitationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  invitationInfo: {
    flex: 1,
  },
  identifier: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  metadata: {
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
