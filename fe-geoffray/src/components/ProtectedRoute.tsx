import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/contexts/AuthContext';
import { Colors } from '@/src/constants/Colors';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallbackRoute?: string;
  requireServerValidation?: boolean;
  showLoadingSpinner?: boolean;
  customLoadingComponent?: React.ReactNode;
  onAuthError?: (error: string) => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallbackRoute = '/auth/login',
  requireServerValidation = false,
  showLoadingSpinner = true,
  customLoadingComponent,
  onAuthError,
}) => {
  const { user, isLoading, isAuthenticated, authError, validateAuth } = useAuth();
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(false);
  const [validationComplete, setValidationComplete] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Wait for initial auth context loading
      if (isLoading) {
        return;
      }

      // If not authenticated locally, redirect immediately
      if (!isAuthenticated || !user) {
        router.replace(fallbackRoute);
        return;
      }

      // If server validation is required, perform it
      if (requireServerValidation && !validationComplete) {
        setIsValidating(true);
        try {
          const isValid = await validateAuth();
          if (!isValid) {
            if (onAuthError) {
              onAuthError('Server authentication validation failed');
            }
            router.replace(fallbackRoute);
            return;
          }
        } catch (error) {
          console.error('Auth validation error:', error);
          if (onAuthError) {
            onAuthError('Authentication validation error');
          }
          router.replace(fallbackRoute);
          return;
        } finally {
          setIsValidating(false);
          setValidationComplete(true);
        }
      } else {
        setValidationComplete(true);
      }
    };

    checkAuth();
  }, [
    isLoading,
    isAuthenticated,
    user,
    requireServerValidation,
    validationComplete,
    validateAuth,
    router,
    fallbackRoute,
    onAuthError,
  ]);

  // Handle auth errors
  useEffect(() => {
    if (authError && onAuthError) {
      onAuthError(authError.message);
    }
  }, [authError, onAuthError]);

  // Show loading state
  if (isLoading || (requireServerValidation && (isValidating || !validationComplete))) {
    if (customLoadingComponent) {
      return <>{customLoadingComponent}</>;
    }

    if (showLoadingSpinner) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <Text style={styles.loadingText}>
            {isValidating ? 'Validating authentication...' : 'Loading...'}
          </Text>
        </View>
      );
    }

    return null;
  }

  // If not authenticated, don't render children (redirect should happen)
  if (!isAuthenticated || !user) {
    return null;
  }

  // Render children if authenticated
  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.text,
    textAlign: 'center',
  },
});

export default ProtectedRoute;