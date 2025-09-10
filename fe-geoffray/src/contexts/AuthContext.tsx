import React, {createContext, ReactNode, useContext, useEffect, useState} from 'react';
import {isAuthenticated, login, logout, getToken} from '@/src/api/authApi';

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

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkAuthentication: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState<boolean>(false);

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const authenticated = await isAuthenticated();
        setIsUserAuthenticated(authenticated);
        if (authenticated) {
          // Get the token and extract user information from it
          const token = await getToken();
          if (token) {
            const decodedToken = decodeJWT(token);
            if (decodedToken) {
              // Extract user ID and other claims from the token
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
            }
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsUserAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
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
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Google and Apple sign-in methods removed as requested

  const signOut = async () => {
    try {
      // Call the logout API endpoint and remove tokens locally
      await logout();
      setUser(null);
      setIsUserAuthenticated(false);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const checkAuthentication = async () => {
    const authenticated = await isAuthenticated();
    setIsUserAuthenticated(authenticated);
    return authenticated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: isUserAuthenticated,
        signIn,
        signOut,
        checkAuthentication,
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
