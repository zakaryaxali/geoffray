import React from 'react';
import {ActivityIndicator, TextInput, TouchableOpacity, View} from 'react-native';
import {ThemedText} from '@/src/components/ThemedText';
import {useTranslation} from 'react-i18next';
import {authStyles} from './AuthStyles';
import {InviteValidationResponse} from '@/src/api/eventApi';

interface SignupFormProps {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  countryCode: string;
  isValidFirstName: boolean;
  isValidLastName: boolean;
  isValidEmail: boolean;
  isValidPassword: boolean;
  isValidPhone: boolean;
  errorMessage: string;
  isRegistering: boolean;
  inviteCode: string | null;
  inviteInfo: InviteValidationResponse | null;
  themeColors: any;
  setFirstName: (value: string) => void;
  setLastName: (value: string) => void;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setPhoneNumber: (value: string) => void;
  setCountryCode: (value: string) => void;
  setIsValidFirstName: (value: boolean) => void;
  setIsValidLastName: (value: boolean) => void;
  setIsValidEmail: (value: boolean) => void;
  setIsValidPassword: (value: boolean) => void;
  setErrorMessage: (value: string) => void;
  handleRegister: () => void;
  navigateToLogin: () => void;
}

export const SignupForm = ({
  firstName,
  lastName,
  email,
  password,
  phoneNumber,
  countryCode,
  isValidFirstName,
  isValidLastName,
  isValidEmail,
  isValidPassword,
  isValidPhone,
  errorMessage,
  isRegistering,
  inviteCode,
  inviteInfo,
  themeColors,
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
  setErrorMessage,
  handleRegister,
  navigateToLogin,
}: SignupFormProps) => {
  const { t } = useTranslation();

  return (
    <View style={authStyles.formContainer}>
      <ThemedText style={[authStyles.formTitle, { color: themeColors.text }]}>
        {inviteCode ? t('auth.createYourAccount') : t('auth.createAccount')}
      </ThemedText>
      
      {!inviteCode && (
        <ThemedText style={[authStyles.subheading, { color: themeColors.textSecondary }]}>
          {t('auth.enterDetailsToSignup')}
        </ThemedText>
      )}
      
      {/* First Name */}
      <View style={authStyles.inputContainer}>
        <ThemedText style={[authStyles.inputLabel, { color: themeColors.textSecondary }]}>
          {t('profile.firstName')} *
        </ThemedText>
        <TextInput
          style={[authStyles.input, { 
            color: themeColors.text,
            borderColor: themeColors.border,
            backgroundColor: themeColors.surfaceVariant
          }, !isValidFirstName && authStyles.inputError]}
          placeholder={t('profile.firstName')}
          placeholderTextColor={themeColors.textSecondary}
          value={firstName}
          onChangeText={(text) => {
            setFirstName(text);
            setIsValidFirstName(true);
            setErrorMessage('');
          }}
          autoCapitalize="words"
        />
        {!isValidFirstName && (
          <ThemedText style={authStyles.validationError}>{t('auth.firstNameRequired')}</ThemedText>
        )}
      </View>
      
      {/* Last Name */}
      <View style={authStyles.inputContainer}>
        <ThemedText style={[authStyles.inputLabel, { color: themeColors.textSecondary }]}>
          {t('profile.lastName')} *
        </ThemedText>
        <TextInput
          style={[authStyles.input, { 
            color: themeColors.text,
            borderColor: themeColors.border,
            backgroundColor: themeColors.surfaceVariant
          }, !isValidLastName && authStyles.inputError]}
          placeholder={t('profile.lastName')}
          placeholderTextColor={themeColors.textSecondary}
          value={lastName}
          onChangeText={(text) => {
            setLastName(text);
            setIsValidLastName(true);
            setErrorMessage('');
          }}
          autoCapitalize="words"
        />
        {!isValidLastName && (
          <ThemedText style={authStyles.validationError}>{t('auth.lastNameRequired')}</ThemedText>
        )}
      </View>
      
      {/* Email */}
      <View style={authStyles.inputContainer}>
        <ThemedText style={[authStyles.inputLabel, { color: themeColors.textSecondary }]}>
          {t('profile.email')} *
        </ThemedText>
        <TextInput
          style={[authStyles.input, { 
            color: themeColors.text,
            borderColor: themeColors.border,
            backgroundColor: themeColors.surfaceVariant
          }, !isValidEmail && authStyles.inputError]}
          placeholder="example@email.com"
          placeholderTextColor={themeColors.textSecondary}
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setIsValidEmail(true);
            setErrorMessage('');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!(inviteInfo && inviteInfo.invitedEmail)} // Make email non-editable if it was provided in the invitation
        />
        {!isValidEmail && (
          <ThemedText style={authStyles.validationError}>{t('auth.validEmailRequired')}</ThemedText>
        )}
      </View>
      
      {/* Phone Number */}
      <View style={authStyles.inputContainer}>
        <ThemedText style={[authStyles.inputLabel, { color: themeColors.textSecondary }]}>
          {t('profile.phoneNumber')} (optional)
        </ThemedText>
        <View style={authStyles.phoneInputContainer}>
          <TextInput
            style={[authStyles.countryCodeInput, { 
              color: themeColors.text,
              borderColor: themeColors.border,
              backgroundColor: themeColors.surfaceVariant
            }, !isValidPhone && authStyles.inputError]}
            placeholder="+1"
            placeholderTextColor={themeColors.textSecondary}
            value={countryCode}
            onChangeText={setCountryCode}
            keyboardType="phone-pad"
            editable={!(inviteInfo && inviteInfo.invitedPhone)} // Make phone non-editable if it was provided in the invitation
          />
          <TextInput
            style={[authStyles.phoneInput, { 
              color: themeColors.text,
              borderColor: themeColors.border,
              backgroundColor: themeColors.surfaceVariant
            }, !isValidPhone && authStyles.inputError]}
            placeholder="123 456 7890"
            placeholderTextColor={themeColors.textSecondary}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            editable={!(inviteInfo && inviteInfo.invitedPhone)} // Make phone non-editable if it was provided in the invitation
          />
        </View>
        {!isValidPhone && (
          <ThemedText style={authStyles.validationError}>{t('auth.validPhoneRequired')}</ThemedText>
        )}
      </View>
      
      {/* Password */}
      <View style={authStyles.inputContainer}>
        <ThemedText style={[authStyles.inputLabel, { color: themeColors.textSecondary }]}>
          {t('auth.password')} *
        </ThemedText>
        <TextInput
          style={[authStyles.input, { 
            color: themeColors.text,
            borderColor: themeColors.border,
            backgroundColor: themeColors.surfaceVariant
          }, !isValidPassword && authStyles.inputError]}
          placeholder={t('auth.password')}
          placeholderTextColor={themeColors.textSecondary}
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setIsValidPassword(true);
            setErrorMessage('');
          }}
          secureTextEntry
        />
        {!isValidPassword && (
          <ThemedText style={authStyles.validationError}>{t('auth.passwordTooShort')}</ThemedText>
        )}
      </View>
      
      {/* Error Message */}
      {errorMessage ? (
        <ThemedText style={[authStyles.errorMessage, { color: themeColors.error }]}>
          {errorMessage}
        </ThemedText>
      ) : null}
      
      {/* Signup Button */}
      <TouchableOpacity
        style={[
          authStyles.signupButton,
          { backgroundColor: themeColors.primary },
          isRegistering && { opacity: 0.7 }
        ]}
        onPress={handleRegister}
        disabled={isRegistering}
      >
        {isRegistering ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <ThemedText style={authStyles.signupButtonText}>
            {inviteCode ? t('auth.createAccountAndJoin') : t('auth.createAccount')}
          </ThemedText>
        )}
      </TouchableOpacity>

      {/* Already have an account */}
      <View style={authStyles.loginLinkContainer}>
        <ThemedText style={[authStyles.loginText, { color: themeColors.textSecondary }]}>
          {t('auth.hasAccount')}
        </ThemedText>
        <TouchableOpacity onPress={navigateToLogin}>
          <ThemedText style={[authStyles.loginLink, { color: themeColors.primary }]}>
            {t('auth.login')}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
};
