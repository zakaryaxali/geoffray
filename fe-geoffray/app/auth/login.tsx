import React, {useEffect, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {router, useLocalSearchParams} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
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
  const { signIn, isLoading } = useAuth();

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

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Rendez-vous</Text>
      </View>
      
      <View style={styles.formContainer}>
        <Text style={styles.heading}>Welcome</Text>
        <Text style={styles.subheading}>Sign in to your account to continue</Text>
        
        <TextInput
          style={[styles.input, !isValidEmail && styles.inputError]}
          placeholder="email@domain.com"
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
          placeholder="Password (min 6 characters)"
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

        <TouchableOpacity onPress={() => console.log('Forgot password pressed')}>
          <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.continueButton} 
          onPress={handleContinue}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.continueButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>
        

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don&apos;t have an account? </Text>
          <TouchableOpacity onPress={navigateToSignup}>
            <Text style={styles.signupLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.footerContainer}>
        <Text style={styles.termsText}>
          By signing in, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text>
          {' '}and{' '}
          <Text 
            style={styles.termsLink}
            onPress={() => router.push('/privacy-policy')}
          >
            Privacy Policy
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  headerContainer: {
    marginTop: 40,
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  formContainer: {
    flex: 1,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
  },
  forgotPasswordText: {
    fontSize: 16,
    color: BrandColors.peach,
    marginBottom: 16,
    textAlign: 'right',
    textDecorationLine: 'underline',
  },
  continueButton: {
    backgroundColor: BrandColors.coral,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#666',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  socialIconContainer: {
    marginRight: 12,
  },
  socialButtonText: {
    fontSize: 16,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  signupText: {
    fontSize: 16,
    color: '#666',
  },
  signupLink: {
    fontSize: 16,
    color: BrandColors.peach,
    fontWeight: '600',
  },
  footerContainer: {
    marginBottom: 20,
  },
  termsText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
  },
  termsLink: {
    color: '#000',
    fontWeight: '500',
  },
});
