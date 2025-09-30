import React, {useState} from 'react';
import {ActivityIndicator, Alert, Platform, ScrollView, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useAuth} from '@/src/contexts/AuthContext';
import {useLocalizedText} from '@/src/hooks/useLocalizedText';
import {useTranslation} from 'react-i18next';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '@/src/contexts/ThemeContext';
import {BrandColors} from '@/src/constants/Colors';
import {useRouter} from 'expo-router';

// Import components
import {PersonalInfoSection} from '@/src/components/profile/PersonalInfoSection';
import {SettingsSection} from '@/src/components/profile/SettingsSection';
import {LanguageModal} from '@/src/components/profile/LanguageModal';
import {ThemeModal} from '@/src/components/profile/ThemeModal';
import {SignOutConfirmModal} from '@/src/components/profile/SignOutConfirmModal';
import {useProfileData} from '@/src/components/profile/useProfileData';
import {profileStyles} from '@/src/components/profile/ProfileStyles';

type SettingItem = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  toggle?: boolean;
  onPress: () => void;
};

export default function ProfileScreen() {
  // Hooks
  const { signOut } = useAuth();
  const { t } = useTranslation();
  const { language, changeLanguage } = useLocalizedText();
  const { theme, themePreference, setThemePreference } = useTheme();
  const router = useRouter();
  
  // Get theme colors based on current theme
  const themeColors = {
    background: theme === 'dark' ? '#121212' : '#FFFFFF',
    surface: theme === 'dark' ? '#1E1E1E' : '#F9F9F9',
    text: theme === 'dark' ? '#FFFFFF' : '#000000',
    textSecondary: theme === 'dark' ? '#AAAAAA' : '#666666',
    border: theme === 'dark' ? '#333333' : '#DDDDDD',
    primary: theme === 'dark' ? BrandColors.coral : BrandColors.peach,
    error: theme === 'dark' ? '#CF6679' : '#B00020',
    success: theme === 'dark' ? '#03DAC5' : '#03DAC5',
    inputBackground: theme === 'dark' ? '#2C2C2C' : '#F0F0F0',
    modalBackground: theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)',
  };

  // Use our custom hook to manage profile data
  const {
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
    isLoading,
    isSaving,
    setFirstName,
    setLastName,
    setCountryCode,
    setPhoneNumber,
    setIsEditingFirstName,
    setIsEditingLastName,
    setIsEditingPhone,
    handleSaveProfile,
    handleSavePhone,
  } = useProfileData();
  
  // Modal state
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const handleChangeLanguage = (newLanguage: string) => {
    changeLanguage(newLanguage);
    setLanguageModalVisible(false);
  };

  const handleChangeTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setThemePreference(newTheme);
    setThemeModalVisible(false);
  };
  
  const handleSignOut = () => {
    // On web, Alert.alert doesn't work properly, so we use a custom modal approach
    if (Platform.OS === 'web') {
      setShowSignOutConfirm(true);
    } else {
      // On mobile, we can use the native Alert
      Alert.alert(
        t('profile.signOut'),
        t('profile.signOutConfirmation'),
        [
          {
            text: t('common.cancel'),
            style: 'cancel',
          },
          {
            text: t('common.confirm'),
            onPress: signOut,
            style: 'destructive',
          },
        ]
      );
    }
  };

  const handleConfirmSignOut = () => {
    setShowSignOutConfirm(false);
    signOut();
  };

  // Settings sections
  const settingsSections: SettingItem[] = [
    {
      title: t('settings.language'),
      icon: 'language-outline',
      value: language === 'en' ? t('settings.english') : t('settings.french'),
      onPress: () => setLanguageModalVisible(true),
    },
    {
      title: t('settings.darkMode'),
      icon: theme === 'dark' ? 'moon' : 'moon-outline',
      value: themePreference === 'system' 
        ? t('settings.systemDefault') 
        : themePreference === 'dark' 
          ? t('settings.darkEnabled') 
          : t('settings.lightEnabled'),
      onPress: () => setThemeModalVisible(true),
    },
    {
      title: t('settings.privacyPolicy'),
      icon: 'shield-outline',
      value: '',
      onPress: () => router.navigate('/privacy-policy'),
    },
    {
      title: t('profile.signOut'),
      icon: 'log-out-outline',
      value: '',
      onPress: handleSignOut,
    },
  ];


  if (isLoading) {
    return (
      <View style={[profileStyles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[profileStyles.safeArea, { backgroundColor: themeColors.background }]}>
      <ScrollView style={[profileStyles.container, { backgroundColor: themeColors.background }]} contentContainerStyle={{ paddingTop: 40 }}>
        
        {/* Personal Information Section */}
        <PersonalInfoSection
          profile={profile}
          firstName={firstName}
          lastName={lastName}
          email={email}
          countryCode={countryCode}
          phoneNumber={phoneNumber}
          isEditingFirstName={isEditingFirstName}
          isEditingLastName={isEditingLastName}
          isEditingPhone={isEditingPhone}
          phoneError={phoneError}
          isSaving={isSaving}
          themeColors={themeColors}
          setFirstName={setFirstName}
          setLastName={setLastName}
          setCountryCode={setCountryCode}
          setPhoneNumber={setPhoneNumber}
          setIsEditingFirstName={setIsEditingFirstName}
          setIsEditingLastName={setIsEditingLastName}
          setIsEditingPhone={setIsEditingPhone}
          handleSaveProfile={handleSaveProfile}
          handleSavePhone={handleSavePhone}
        />

        {/* Settings Section */}
        <SettingsSection
          settingsSections={settingsSections}
          themeColors={themeColors}
        />
      </ScrollView>

      {/* Language Modal */}
      <LanguageModal
        visible={languageModalVisible}
        onClose={() => setLanguageModalVisible(false)}
        language={language}
        onChangeLanguage={handleChangeLanguage}
        themeColors={themeColors}
      />

      {/* Theme Modal */}
      <ThemeModal
        visible={themeModalVisible}
        onClose={() => setThemeModalVisible(false)}
        themePreference={themePreference}
        onChangeTheme={handleChangeTheme}
        themeColors={themeColors}
      />

      {/* Custom Sign Out Confirmation Modal for Web */}
      {Platform.OS === 'web' && (
        <SignOutConfirmModal
          visible={showSignOutConfirm}
          onClose={() => setShowSignOutConfirm(false)}
          onConfirm={handleConfirmSignOut}
          themeColors={themeColors}
        />
      )}
    </SafeAreaView>
  );
}
