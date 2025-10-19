import React, {useEffect, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {router, useLocalSearchParams} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import {useAuth} from '@/src/contexts/AuthContext';
import {BrandColors} from '@/src/constants/Colors';
import { useTranslation } from 'react-i18next';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { email: prefillEmail } = useLocalSearchParams<{ email: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isValidEmail, setIsValidEmail] = useState(true);
  const [isValidPassword, setIsValidPassword] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { signIn, signInWithGoogle, isLoading } = useAuth();

  useEffect(() => {
    if (prefillEmail) {
      setEmail(prefillEmail);
    }
  }, [prefillEmail]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleContinue = async () => {
    setErrorMessage('');
    let isValid = true;

    if (!email || !validateEmail(email)) {
      setIsValidEmail(false);
      isValid = false;
    } else {
      setIsValidEmail(true);
    }

    if (!password || !validatePassword(password)) {
      setIsValidPassword(false);
      isValid = false;
    } else {
      setIsValidPassword(true);
    }

    if (!isValid) return;

    try {
      // Now uses Firebase authentication
      await signIn(email, password);
      router.replace('/home');
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Login failed. Please try again.');
    }
  };


  const navigateToSignup = () => {
    router.push('/auth/signup');
  };
  
  const handleGooglePress = async () => {
    setIsGoogleLoading(true);
    setErrorMessage('');
    
    try {
      await signInWithGoogle();
      router.replace('/home');
    } catch (error) {
      console.error('Google sign in error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Google sign in failed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[BrandColors.gradientPeach, BrandColors.gradientPink]}
      style={styles.container}
    >
      <StatusBar style="light" />
      
      <View style={styles.headerContainer}>
        <Text style={styles.title}>geoffray</Text>
        <Text style={styles.tagline}>{t('auth.tagline')}</Text>
      </View>
      
      <View style={styles.formContainer}>
        <TextInput
          style={[styles.input, !isValidEmail && styles.inputError]}
          placeholder={t('auth.email')}
          placeholderTextColor="#999"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setIsValidEmail(true);
            setErrorMessage('');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        {!isValidEmail && (
          <Text style={styles.errorText}>Please enter a valid email address</Text>
        )}
        
        <TextInput
          style={[styles.input, !isValidPassword && styles.inputError]}
          placeholder={t('auth.password')}
          placeholderTextColor="#999"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setIsValidPassword(true);
            setErrorMessage('');
          }}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

        {!isValidPassword && (
          <Text style={styles.errorText}>Password must be at least 6 characters</Text>
        )}

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        <TouchableOpacity
          style={styles.continueButton} 
          onPress={handleContinue}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={BrandColors.gradientInputText} />
          ) : (
            <Text style={styles.continueButtonText}>{t('auth.login')}</Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>{t('auth.or')}</Text>
          <View style={styles.divider} />
        </View>
        
        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGooglePress}
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? (
            <ActivityIndicator color={BrandColors.gradientInputText} />
          ) : (
            <Text style={styles.googleButtonText}>{t('auth.signInWithGoogle')}</Text>
          )}
        </TouchableOpacity>
        

        <View style={styles.footerContainer}>
          <TouchableOpacity onPress={navigateToSignup}>
            <Text style={styles.signupLink}>{t('auth.signup')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => console.log('Forgot password pressed')}>
            <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: '300',
    color: BrandColors.gradientText,
    marginBottom: 16,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: BrandColors.gradientTextSecondary,
    textAlign: 'center',
    fontWeight: '400',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 80,
  },
  input: {
    height: 56,
    backgroundColor: BrandColors.gradientInput,
    borderRadius: 12,
    paddingHorizontal: 20,
    fontSize: 16,
    marginBottom: 20,
    color: BrandColors.gradientInputText,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputError: {
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
  errorText: {
    color: BrandColors.gradientText,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    padding: 8,
    borderRadius: 6,
    marginBottom: 16,
    fontSize: 14,
  },
  continueButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  continueButtonText: {
    color: BrandColors.gradientText,
    fontSize: 18,
    fontWeight: '600',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  signupLink: {
    fontSize: 16,
    color: BrandColors.gradientText,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  forgotPasswordText: {
    fontSize: 16,
    color: BrandColors.gradientText,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    color: BrandColors.gradientText,
    paddingHorizontal: 10,
    fontSize: 14,
    fontWeight: '500',
  },
  googleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleButtonText: {
    color: '#4285F4',
    fontSize: 18,
    fontWeight: '600',
  },
});
