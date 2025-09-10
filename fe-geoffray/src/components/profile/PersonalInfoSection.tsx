import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ProfileData } from '@/src/api/profileApi';

interface PersonalInfoSectionProps {
  profile: ProfileData | null;
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  phoneNumber: string;
  isEditingFirstName: boolean;
  isEditingLastName: boolean;
  isEditingPhone: boolean;
  phoneError: string | null;
  isSaving: boolean;
  themeColors: any;
  setFirstName: (value: string) => void;
  setLastName: (value: string) => void;
  setCountryCode: (value: string) => void;
  setPhoneNumber: (value: string) => void;
  setIsEditingFirstName: (value: boolean) => void;
  setIsEditingLastName: (value: boolean) => void;
  setIsEditingPhone: (value: boolean) => void;
  handleSaveProfile: () => void;
  handleSavePhone: () => void;
}

export const PersonalInfoSection = ({
  profile,
  firstName,
  lastName,
  email,
  countryCode,
  phoneNumber,
  isEditingFirstName,
  isEditingLastName,
  isEditingPhone,
  phoneError,
  isSaving,
  themeColors,
  setFirstName,
  setLastName,
  setCountryCode,
  setPhoneNumber,
  setIsEditingFirstName,
  setIsEditingLastName,
  setIsEditingPhone,
  handleSaveProfile,
  handleSavePhone,
}: PersonalInfoSectionProps) => {
  const { t } = useTranslation();

  return (
    <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
      <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{t('profile.personalInfo')}</Text>
      
      {/* First Name */}
      <View style={styles.profileInfoContainer}>
        <View style={styles.profileInfoHeader}>
          <Text style={[styles.profileInfoLabel, { color: themeColors.textSecondary }]}>{t('profile.firstName')}</Text>
          {!isEditingFirstName && (
            <TouchableOpacity onPress={() => setIsEditingFirstName(true)}>
              <Ionicons name="create-outline" size={20} color={themeColors.primary} />
            </TouchableOpacity>
          )}
        </View>
        {isEditingFirstName ? (
          <View style={styles.editContainer}>
            <TextInput
              style={[styles.input, { backgroundColor: themeColors.inputBackground, color: themeColors.text }]}
              value={firstName}
              onChangeText={setFirstName}
              placeholder={t('profile.enterFirstName')}
              placeholderTextColor={themeColors.textSecondary}
            />
            <View style={styles.editActions}>
              <TouchableOpacity 
                style={[styles.editButton, styles.cancelButton, { borderColor: themeColors.border }]} 
                onPress={() => {
                  setFirstName(profile?.first_name || '');
                  setIsEditingFirstName(false);
                }}
              >
                <Text style={[styles.editButtonText, { color: themeColors.text }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.editButton, styles.saveButton, { backgroundColor: themeColors.primary }]} 
                onPress={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={[styles.profileInfoValue, { color: themeColors.text }]}>
            {firstName || '—'}
          </Text>
        )}
      </View>

      {/* Last Name */}
      <View style={styles.profileInfoContainer}>
        <View style={styles.profileInfoHeader}>
          <Text style={[styles.profileInfoLabel, { color: themeColors.textSecondary }]}>{t('profile.lastName')}</Text>
          {!isEditingLastName && (
            <TouchableOpacity onPress={() => setIsEditingLastName(true)}>
              <Ionicons name="create-outline" size={20} color={themeColors.primary} />
            </TouchableOpacity>
          )}
        </View>
        {isEditingLastName ? (
          <View style={styles.editContainer}>
            <TextInput
              style={[styles.input, { backgroundColor: themeColors.inputBackground, color: themeColors.text }]}
              value={lastName}
              onChangeText={setLastName}
              placeholder={t('profile.enterLastName')}
              placeholderTextColor={themeColors.textSecondary}
            />
            <View style={styles.editActions}>
              <TouchableOpacity 
                style={[styles.editButton, styles.cancelButton, { borderColor: themeColors.border }]} 
                onPress={() => {
                  setLastName(profile?.last_name || '');
                  setIsEditingLastName(false);
                }}
              >
                <Text style={[styles.editButtonText, { color: themeColors.text }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.editButton, styles.saveButton, { backgroundColor: themeColors.primary }]} 
                onPress={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={[styles.profileInfoValue, { color: themeColors.text }]}>
            {lastName || '—'}
          </Text>
        )}
      </View>

      {/* Email */}
      <View style={styles.profileInfoContainer}>
        <View style={styles.profileInfoHeader}>
          <Text style={[styles.profileInfoLabel, { color: themeColors.textSecondary }]}>{t('profile.email')}</Text>
        </View>
        <Text style={[styles.profileInfoValue, { color: themeColors.text }]}>
          {email || '—'}
        </Text>
      </View>

      {/* Phone Number */}
      <View style={styles.profileInfoContainer}>
        <View style={styles.profileInfoHeader}>
          <Text style={[styles.profileInfoLabel, { color: themeColors.textSecondary }]}>{t('profile.phoneNumber')}</Text>
          {!isEditingPhone && (
            <TouchableOpacity onPress={() => setIsEditingPhone(true)}>
              <Ionicons name="create-outline" size={20} color={themeColors.primary} />
            </TouchableOpacity>
          )}
        </View>
        {isEditingPhone ? (
          <View style={styles.editContainer}>
            <View style={styles.phoneInputContainer}>
              <TextInput
                style={[styles.phoneInput, styles.countryCodeInput, { backgroundColor: themeColors.inputBackground, color: themeColors.text }]}
                value={countryCode}
                onChangeText={setCountryCode}
                placeholder="+1"
                placeholderTextColor={themeColors.textSecondary}
                keyboardType="phone-pad"
              />
              <TextInput
                style={[styles.phoneInput, { backgroundColor: themeColors.inputBackground, color: themeColors.text }]}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder={t('profile.enterPhoneNumber')}
                placeholderTextColor={themeColors.textSecondary}
                keyboardType="phone-pad"
              />
            </View>
            {phoneError && (
              <Text style={[styles.errorText, { color: themeColors.error }]}>{phoneError}</Text>
            )}
            <View style={styles.editActions}>
              <TouchableOpacity 
                style={[styles.editButton, styles.cancelButton, { borderColor: themeColors.border }]} 
                onPress={() => {
                  setCountryCode(profile?.country_code || '');
                  setPhoneNumber(profile?.phone_number || '');
                  setIsEditingPhone(false);
                }}
              >
                <Text style={[styles.editButtonText, { color: themeColors.text }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.editButton, styles.saveButton, { backgroundColor: themeColors.primary }]} 
                onPress={handleSavePhone}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={[styles.profileInfoValue, { color: themeColors.text }]}>
            {countryCode && phoneNumber ? `${countryCode} ${phoneNumber}` : '—'}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  profileInfoContainer: {
    marginBottom: 15,
  },
  profileInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  profileInfoLabel: {
    fontSize: 14,
  },
  profileInfoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  editContainer: {
    marginTop: 5,
  },
  input: {
    height: 46,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  phoneInputContainer: {
    flexDirection: 'row',
  },
  phoneInput: {
    height: 46,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    flex: 1,
  },
  countryCodeInput: {
    flex: 0.3,
    marginRight: 10,
  },
  errorText: {
    fontSize: 14,
    marginTop: 5,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  editButton: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
    minWidth: 80,
  },
  editButtonText: {
    fontSize: 16,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
