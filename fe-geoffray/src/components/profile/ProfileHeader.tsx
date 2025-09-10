import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface ProfileHeaderProps {
  firstName: string;
  lastName: string;
  email: string;
  profileImage: string | null;
  onEditImage: () => void;
  themeColors: any;
}

export const ProfileHeader = ({
  firstName,
  lastName,
  email,
  profileImage,
  onEditImage,
  themeColors,
}: ProfileHeaderProps) => {
  const { t } = useTranslation();

  return (
    <>
      <View style={styles.profileHeader}>
        <Text style={[styles.title, { color: themeColors.text }]}>{t('profile.myProfile')}</Text>
        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>{t('common.welcome')}</Text>
      </View>
      
      <View style={[styles.profileImageContainer, { backgroundColor: themeColors.surface }]}>
        <View style={styles.profileImageWrapper}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={[styles.profileImagePlaceholder, { backgroundColor: themeColors.border }]}>
              <Ionicons name="person" size={50} color={themeColors.textSecondary} />
            </View>
          )}
          <TouchableOpacity 
            style={[styles.editImageButton, { backgroundColor: themeColors.primary }]}
            onPress={onEditImage}
          >
            <Ionicons name="camera" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <Text style={[styles.profileName, { color: themeColors.text }]}>
          {firstName || lastName ? `${firstName} ${lastName}` : t('profile.yourName')}
        </Text>
        <Text style={[styles.profileEmail, { color: themeColors.textSecondary }]}>{email}</Text>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  profileHeader: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
  },
  profileImageContainer: {
    alignItems: 'center',
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
  },
  profileImageWrapper: {
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 16,
  },
});
