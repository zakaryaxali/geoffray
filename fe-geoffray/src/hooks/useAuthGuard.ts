import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/contexts/AuthContext';

interface UseAuthGuardOptions {
  redirectTo?: string;
  requireServerValidation?: boolean;
  onAuthError?: (error: string) => void;
  onAuthSuccess?: () => void;
}

interface UseAuthGuardReturn {
  isAuthenticating: boolean;
  isAuthenticated: boolean;
  authError: string | null;
  retryAuth: () => Promise<void>;
}

export const useAuthGuard = (options: UseAuthGuardOptions = {}): UseAuthGuardReturn => {
  const {
    redirectTo = '/auth/login',
    requireServerValidation = false,
    onAuthError,
    onAuthSuccess,
  } = options;

  const { user, isLoading, isAuthenticated, authError, validateAuth } = useAuth();
  const router = useRouter();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [validationComplete, setValidationComplete] = useState(false);
  const [localAuthError, setLocalAuthError] = useState<string | null>(null);

  const performAuthCheck = async () => {
    setLocalAuthError(null);
    
    // Wait for initial auth context loading
    if (isLoading) {
      return;
    }

    // If not authenticated locally, redirect
    if (!isAuthenticated || !user) {
      const errorMessage = 'Authentication required';
      setLocalAuthError(errorMessage);
      if (onAuthError) {
        onAuthError(errorMessage);
      }
      router.replace(redirectTo);
      return;
    }

    // If server validation is required
    if (requireServerValidation && !validationComplete) {
      setIsAuthenticating(true);
      try {
        const isValid = await validateAuth();
        if (!isValid) {
          const errorMessage = 'Server authentication validation failed';
          setLocalAuthError(errorMessage);
          if (onAuthError) {
            onAuthError(errorMessage);
          }
          router.replace(redirectTo);
          return;
        }
        setValidationComplete(true);
        if (onAuthSuccess) {
          onAuthSuccess();
        }
      } catch (error) {
        const errorMessage = 'Authentication validation error';
        setLocalAuthError(errorMessage);
        console.error('Auth validation error:', error);
        if (onAuthError) {
          onAuthError(errorMessage);
        }
        router.replace(redirectTo);
        return;
      } finally {
        setIsAuthenticating(false);
      }
    } else if (isAuthenticated && user) {
      setValidationComplete(true);
      if (onAuthSuccess) {
        onAuthSuccess();
      }
    }
  };

  useEffect(() => {
    performAuthCheck();
  }, [
    isLoading,
    isAuthenticated,
    user,
    requireServerValidation,
    validationComplete,
  ]);

  // Handle auth context errors
  useEffect(() => {
    if (authError) {
      setLocalAuthError(authError.message);
      if (onAuthError) {
        onAuthError(authError.message);
      }
    }
  }, [authError, onAuthError]);

  const retryAuth = async () => {
    setValidationComplete(false);
    await performAuthCheck();
  };

  return {
    isAuthenticating: isLoading || isAuthenticating,
    isAuthenticated: isAuthenticated && !!user && validationComplete,
    authError: localAuthError || (authError?.message ?? null),
    retryAuth,
  };
};

export default useAuthGuard;