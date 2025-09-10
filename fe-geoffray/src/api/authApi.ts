import { apiConfig } from './config';
import { setItem, getItem, removeItem } from '../crossPlatformStorage';

const ACCESS_TOKEN_KEY = 'rendez_vous_access_token';
const REFRESH_TOKEN_KEY = 'rendez_vous_refresh_token';
const TOKEN_EXPIRY_KEY = 'rendez_vous_token_expiry';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  refresh_token?: string;
  expires_in?: number;
}

/**
 * Register a new user with first name, last name, email, password, and optional phone number
 */
export const register = async (
  username: string, 
  email: string, 
  password: string, 
  firstName?: string, 
  lastName?: string, 
  phoneNumber?: string,
  countryCode?: string
): Promise<void> => {
  try {
    // Format the country code to ensure it has a + prefix if provided
    let formattedCountryCode = countryCode;
    if (countryCode && !countryCode.startsWith('+')) {
      formattedCountryCode = `+${countryCode}`;
    }

    const response = await fetch(`${apiConfig.baseUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        username, 
        email, 
        password, 
        first_name: firstName, 
        last_name: lastName, 
        phone_number: phoneNumber,
        country_code: formattedCountryCode
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Registration failed' }));
      const errorMessage = errorData.message || 'Registration failed';
      throw new Error(errorMessage);
    }

    // Registration successful, but we don't automatically log the user in
    // They will be redirected to the login page
    return;
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`An unexpected error occurred during registration: ${error}`);
    }
  }
};

/**
 * Authenticate user with email and password
 */
export const login = async (email: string, password: string): Promise<string> => {
  try {
    const response = await fetch(`${apiConfig.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
      const errorMessage = errorData.message || 'Login failed';
      throw new Error(errorMessage);
    }

    const data: AuthResponse = await response.json();
    
    // Store the tokens securely
    await saveTokens(data.token, data.refresh_token, data.expires_in);
    
    return data.token;
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`An unexpected error occurred during login: ${error}`);
    }
  }
};

/**
 * Save authentication tokens securely
 */
export const saveTokens = async (accessToken: string, refreshToken: string | undefined, expiresIn: number | undefined): Promise<void> => {
  await setItem(ACCESS_TOKEN_KEY, accessToken);
  
  if (refreshToken) {
    await setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
  
  if (expiresIn) {
    const expiryTime = Date.now() + expiresIn * 1000;
    await setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  }
};

/**
 * Get the stored access token
 */
export const getToken = async (): Promise<string | null> => {
  return await getItem(ACCESS_TOKEN_KEY);
};

/**
 * Get the stored refresh token
 */
export const getRefreshToken = async (): Promise<string | null> => {
  return await getItem(REFRESH_TOKEN_KEY);
};

/**
 * Check if the access token is expired
 */
export const isTokenExpired = async (): Promise<boolean> => {
  const expiryTime = await getItem(TOKEN_EXPIRY_KEY);
  if (!expiryTime) return false; // If no expiry time, assume not expired
  
  return Date.now() > parseInt(expiryTime);
};

/**
 * Remove all stored authentication tokens
 */
export const removeTokens = async (): Promise<void> => {
  await removeItem(ACCESS_TOKEN_KEY);
  await removeItem(REFRESH_TOKEN_KEY);
  await removeItem(TOKEN_EXPIRY_KEY);
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getToken();
  return !!token;
};

/**
 * Get authorization header with bearer token
 */
export const getAuthHeader = async (): Promise<Record<string, string>> => {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Refresh the access token using the refresh token
 */
export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return null;
    
    const response = await fetch(`${apiConfig.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    
    if (!response.ok) {
      // If refresh fails, clear tokens and return null
      await removeTokens();
      return null;
    }
    
    const data = await response.json();
    await saveTokens(data.token, undefined, data.expires_in);
    return data.token;
  } catch (error) {
    console.error('Token refresh error:', error);
    await removeTokens();
    return null;
  }
};

/**
 * Logout the user by invalidating the refresh token
 */
export const logout = async (): Promise<void> => {
  try {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      // Call the logout endpoint to invalidate the refresh token
      await fetch(`${apiConfig.baseUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always clear tokens locally regardless of server response
    await removeTokens();
  }
};
