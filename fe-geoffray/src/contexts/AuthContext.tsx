import React, {createContext, ReactNode, useContext, useEffect, useState} from 'react';
import {isAuthenticated, login, logout, getToken, validateTokenWithServer, isAuthenticatedLocal} from '@/src/api/authApi';

// Function to decode JWT token
const decodeJWT = (token: string): any => {
  try {
    // Split the token and get the payload part (second part)
    const base64Url = token.split('.')[1];
    if (!base64Url) {
      console.error('Invalid token format: missing payload section');
      return null;
    }
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Decode the base64 string
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')
    );
    
    const decodedToken = JSON.parse(jsonPayload);
    
    // Log available fields for debugging
    console.log('Decoded JWT fields:', Object.keys(decodedToken));
    
    // Validate required fields
    if (!decodedToken.user_id) {
      console.warn('JWT missing user_id field');
    }
    
    return decodedToken;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

type User = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  countryCode?: string;
  phoneNumber?: string;
  // Add more user properties as needed
};

type AuthError = {
  message: string;
  type: 'network' | 'auth' | 'validation' | 'unknown';
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authError: AuthError | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkAuthentication: () => Promise<boolean>;
  validateAuth: () => Promise<boolean>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<AuthError | null>(null);

  // Clear any auth errors
  const clearError = () => {
    setAuthError(null);
  };

  // Enhanced authentication validation with server check
  const validateAuth = async (): Promise<boolean> => {
    try {
      setAuthError(null);
      const validation = await validateTokenWithServer();
      
      if (validation.valid && validation.user) {
        setIsUserAuthenticated(true);
        setUser({
          id: validation.user.id,
          email: validation.user.email,
          firstName: validation.user.firstName,
          lastName: validation.user.lastName,
        });
        return true;
      } else {
        setIsUserAuthenticated(false);
        setUser(null);
        if (validation.error) {
          setAuthError({
            message: validation.error,
            type: validation.error.includes('network') ? 'network' : 'validation'
          });
        }
        return false;
      }
    } catch (error) {
      console.error('Auth validation error:', error);
      setAuthError({
        message: 'Failed to validate authentication',
        type: 'network'
      });
      setIsUserAuthenticated(false);
      setUser(null);
      return false;
    }
  };

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      setAuthError(null);
      
      try {
        // First do a quick local check
        const localAuth = await isAuthenticatedLocal();
        if (!localAuth) {
          setIsUserAuthenticated(false);
          setUser(null);
          setIsLoading(false);
          return;
        }

        // Then validate with server for robust authentication
        const serverValidation = await validateTokenWithServer();
        
        if (serverValidation.valid && serverValidation.user) {
          setIsUserAuthenticated(true);
          setUser({
            id: serverValidation.user.id,
            email: serverValidation.user.email,
            firstName: serverValidation.user.firstName,
            lastName: serverValidation.user.lastName,
          });
        } else {
          // If server validation fails, try local token decoding as fallback
          setIsUserAuthenticated(false);
          const token = await getToken();
          if (token) {
            const decodedToken = decodeJWT(token);
            if (decodedToken) {
              // Use local token but mark as potentially invalid
              const userId = decodedToken.sub || decodedToken.id || decodedToken.user_id;
              const userEmail = decodedToken.email || 'user@example.com';
              
              setUser({
                id: userId,
                email: userEmail,
                firstName: decodedToken.first_name,
                lastName: decodedToken.last_name,
                countryCode: decodedToken.country_code,
                phoneNumber: decodedToken.phone_number
              });
              
              // Set a warning that server validation failed
              setAuthError({
                message: 'Unable to verify authentication with server',
                type: 'network'
              });
            }
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setAuthError({
          message: 'Failed to check authentication status',
          type: 'network'
        });
        setIsUserAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      // Call the login API which returns the token
      const token = await login(email, password);
      
      // Decode the token to get user information
      const decodedToken = decodeJWT(token);
      if (decodedToken) {
        // Extract user ID and other claims from the token
        const userId = decodedToken.sub || decodedToken.id || decodedToken.user_id;
        
        setUser({
          id: userId,
          email,
          firstName: decodedToken.first_name,
          lastName: decodedToken.last_name,
          countryCode: decodedToken.country_code,
          phoneNumber: decodedToken.phone_number
        });
      } else {
        // Fallback if token can't be decoded
        setUser({ id: 'unknown', email });
      }
      
      setIsUserAuthenticated(true);
    } catch (error) {
      console.error('Sign in error:', error);
      setAuthError({
        message: error instanceof Error ? error.message : 'Sign in failed',
        type: 'auth'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Google and Apple sign-in methods removed as requested

  const signOut = async () => {
    try {
      setAuthError(null);
      // Call the logout API endpoint and remove tokens locally
      await logout();
      setUser(null);
      setIsUserAuthenticated(false);
    } catch (error) {
      console.error('Sign out error:', error);
      setAuthError({
        message: 'Failed to sign out properly',
        type: 'network'
      });
      // Still clear local state even if server logout fails
      setUser(null);
      setIsUserAuthenticated(false);
    }
  };

  const checkAuthentication = async () => {
    try {
      setAuthError(null);
      const authenticated = await isAuthenticated();
      setIsUserAuthenticated(authenticated);
      if (!authenticated) {
        setUser(null);
      }
      return authenticated;
    } catch (error) {
      console.error('Check authentication error:', error);
      setAuthError({
        message: 'Failed to check authentication status',
        type: 'network'
      });
      setIsUserAuthenticated(false);
      setUser(null);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: isUserAuthenticated,
        authError,
        signIn,
        signOut,
        checkAuthentication,
        validateAuth,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
