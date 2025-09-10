import { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { register } from '@/src/api/authApi';
import { eventApi, InviteValidationResponse } from '@/src/api/eventApi';
import { useAuth } from '@/src/contexts/AuthContext';

// Array of random event banner images for the invite context
const randomEventBanners = [
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80',
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80',
];

// Function to get a random banner image
const getRandomBanner = () => {
  const randomIndex = Math.floor(Math.random() * randomEventBanners.length);
  return randomEventBanners[randomIndex];
};

export const useSignupData = (inviteCode: string | null) => {
  const { t } = useTranslation();
  const { } = useAuth();

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  
  // Form validation state
  const [isValidFirstName, setIsValidFirstName] = useState(true);
  const [isValidLastName, setIsValidLastName] = useState(true);
  const [isValidEmail, setIsValidEmail] = useState(true);
  const [isValidPassword, setIsValidPassword] = useState(true);
  const [isValidPhone, setIsValidPhone] = useState(true);
  
  // UI state
  const [errorMessage, setErrorMessage] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(!!inviteCode);
  const [inviteInfo, setInviteInfo] = useState<InviteValidationResponse | null>(null);
  const [bannerImage] = useState(getRandomBanner());

  // Validate the invitation code on load if provided
  useEffect(() => {
    if (!inviteCode) return;
    
    const validateInvite = async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        
        // Validate the invitation
        const response = await eventApi.validateInvite(inviteCode);
        setInviteInfo(response);
        
        if (!response.valid) {
          setErrorMessage(response.message || t('event.invalidInvitation'));
          return;
        }
        
        // Pre-fill email if it was provided in the invitation
        if (response.invitedEmail) {
          setEmail(response.invitedEmail);
        }
        
        // Pre-fill phone if it was provided in the invitation
        if (response.invitedPhone) {
          // Extract country code and phone number
          const phone = response.invitedPhone;
          if (phone.startsWith('+')) {
            // Simple parsing - this could be more sophisticated
            const countryCodeEnd = phone.indexOf(' ') > 0 ? phone.indexOf(' ') : 3;
            setCountryCode(phone.substring(0, countryCodeEnd));
            setPhoneNumber(phone.substring(countryCodeEnd).trim());
          } else {
            setPhoneNumber(phone);
          }
        }
      } catch (error) {
        console.error('Error validating invitation:', error);
        setErrorMessage(t('event.failedToValidateInvitation'));
      } finally {
        setLoading(false);
      }
    };
    
    validateInvite();
  }, [inviteCode, t]);

  // Form validation functions
  const validateName = (name: string) => {
    return name.trim().length >= 2;
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const validatePhone = (phone: string) => {
    return phone.trim().length >= 6;
  };

  // Handle signup (with or without invitation)
  const handleRegister = async () => {
    setErrorMessage('');
    let isValid = true;

    // Validate first name
    if (!firstName || !validateName(firstName)) {
      setIsValidFirstName(false);
      isValid = false;
    } else {
      setIsValidFirstName(true);
    }

    // Validate last name
    if (!lastName || !validateName(lastName)) {
      setIsValidLastName(false);
      isValid = false;
    } else {
      setIsValidLastName(true);
    }

    // Validate email
    if (!email || !validateEmail(email)) {
      setIsValidEmail(false);
      isValid = false;
    } else {
      setIsValidEmail(true);
    }

    // Validate password
    if (!password || !validatePassword(password)) {
      setIsValidPassword(false);
      isValid = false;
    } else {
      setIsValidPassword(true);
    }

    // Validate phone (only if provided - phone is optional)
    if (phoneNumber && phoneNumber.trim() !== '' && !validatePhone(phoneNumber)) {
      setIsValidPhone(false);
      isValid = false;
    } else {
      setIsValidPhone(true);
    }

    if (!isValid) return;

    try {
      setIsRegistering(true);
      
      // Construct the full name from first and last name
      const fullName = `${firstName} ${lastName}`;
      
      // Only pass phone number and country code if they are provided
      const finalPhoneNumber = phoneNumber && phoneNumber.trim() !== '' ? phoneNumber : undefined;
      const finalCountryCode = finalPhoneNumber ? countryCode : undefined;
      
      // Call the registration API function with all user details
      await register(fullName, email, password, firstName, lastName, finalPhoneNumber, finalCountryCode);
      
      // If we have a valid invite code, accept the invitation
      if (inviteCode && inviteInfo?.valid) {
        const response = await eventApi.acceptInvite(inviteCode);
        
        if (response.success && response.eventId) {
          // Show success message and navigate to the event
          if (Platform.OS === 'web') {
            // For web, use browser's alert and then redirect
            window.alert(`${t('auth.registrationSuccessful')}\n${t('event.accountCreatedAndJoined')}`);
            // Redirect to event page
            window.location.href = `/event/${response.eventId}`;
          } else {
            // For native platforms, use React Native Alert
            Alert.alert(
              t('auth.registrationSuccessful'),
              t('event.accountCreatedAndJoined'),
              [{ text: t('common.ok'), onPress: () => router.replace(`/event/${response.eventId}`) }]
            );
          }
          return;
        }
      }
      
      // Regular signup flow (no invitation or invitation failed)
      if (Platform.OS === 'web') {
        // For web, use browser's alert and then redirect
        window.alert(`${t('auth.registrationSuccessful')}\n${t('auth.accountCreatedSuccessfully')}`);
        // Redirect to login page
        const url = `/auth/login?email=${encodeURIComponent(email)}`;
        window.location.href = url;
      } else {
        // For native platforms, use React Native Alert
        Alert.alert(
          t('auth.registrationSuccessful'),
          t('auth.accountCreatedSuccessfully'),
          [{ 
            text: t('common.ok'), 
            onPress: () => {
              router.replace({
                pathname: '/auth/login',
                params: { email: email }
              });
            }
          }]
        );
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrorMessage(error instanceof Error ? error.message : t('auth.registrationFailed'));
    } finally {
      setIsRegistering(false);
    }
  };

  const navigateToLogin = () => {
    if (email) {
      // For web, use window.location for more reliable navigation
      if (Platform.OS === 'web') {
        const url = `/auth/login?email=${encodeURIComponent(email)}`;
        window.location.href = url;
      } else {
        // For native platforms, use Expo Router
        router.push({
          pathname: '/auth/login',
          params: { email: email }
        });
      }
    } else {
      // For web, use window.location for more reliable navigation
      if (Platform.OS === 'web') {
        window.location.href = '/auth/login';
      } else {
        // For native platforms, use Expo Router
        router.push('/auth/login');
      }
    }
  };

  return {
    // Form state
    firstName,
    lastName,
    email,
    password,
    phoneNumber,
    countryCode,
    
    // Form validation state
    isValidFirstName,
    isValidLastName,
    isValidEmail,
    isValidPassword,
    isValidPhone,
    
    // UI state
    errorMessage,
    isRegistering,
    loading,
    inviteInfo,
    bannerImage,
    
    // Setters
    setFirstName,
    setLastName,
    setEmail,
    setPassword,
    setPhoneNumber,
    setCountryCode,
    setIsValidFirstName,
    setIsValidLastName,
    setIsValidEmail,
    setIsValidPassword,
    setIsValidPhone,
    setErrorMessage,
    
    // Actions
    handleRegister,
    navigateToLogin
  };
};
