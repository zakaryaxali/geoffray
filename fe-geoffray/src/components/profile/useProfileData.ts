import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { getProfile, ProfileData, updateProfile } from '@/src/api/profileApi';
import { useTranslation } from 'react-i18next';

export const useProfileData = () => {
  const { t } = useTranslation();
  
  // State variables
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isEditingFirstName, setIsEditingFirstName] = useState(false);
  const [isEditingLastName, setIsEditingLastName] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch profile data on hook initialization
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const profileData = await getProfile();
      setProfile(profileData);
      setFirstName(profileData.first_name || '');
      setLastName(profileData.last_name || '');
      setEmail(profileData.email || '');
      setCountryCode(profileData.country_code || '');
      setPhoneNumber(profileData.phone_number || '');
      setProfileImage(profileData.profilePicture || null);
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert(t('common.error'), t('profile.errorFetchingProfile'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const updatedProfile = await updateProfile({
        first_name: firstName,
        last_name: lastName,
        country_code: countryCode,
        phone_number: phoneNumber,
        profilePicture: profileImage || undefined,
      });
      setProfile(updatedProfile);
      setIsEditingFirstName(false);
      setIsEditingLastName(false);
      setIsEditingPhone(false);
      Alert.alert(t('common.success'), t('profile.profileUpdated'));
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(t('common.error'), t('profile.errorUpdatingProfile'));
    } finally {
      setIsSaving(false);
    }
  };

  const validatePhoneNumber = () => {
    if ((countryCode && !phoneNumber) || (!countryCode && phoneNumber)) {
      setPhoneError(t('profile.bothPhoneFieldsRequired'));
      return false;
    }
    
    if (countryCode && !/^\+\d{1,4}$/.test(countryCode)) {
      setPhoneError(t('profile.invalidCountryCode'));
      return false;
    }
    
    if (phoneNumber && !/^\d{6,15}$/.test(phoneNumber)) {
      setPhoneError(t('profile.invalidPhoneNumber'));
      return false;
    }
    
    setPhoneError(null);
    return true;
  };

  const handleSavePhone = () => {
    if (validatePhoneNumber()) {
      handleSaveProfile();
    }
  };

  return {
    profile,
    profileImage,
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
    setProfileImage,
    setFirstName,
    setLastName,
    setCountryCode,
    setPhoneNumber,
    setIsEditingFirstName,
    setIsEditingLastName,
    setIsEditingPhone,
    setPhoneError,
    fetchProfile,
    handleSaveProfile,
    handleSavePhone,
  };
};
