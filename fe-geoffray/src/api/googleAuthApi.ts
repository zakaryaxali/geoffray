import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { AuthSessionResult } from 'expo-auth-session';
import { apiConfig } from './config';
import { saveTokens } from './authApi';

WebBrowser.maybeCompleteAuthSession();

export interface GoogleAuthConfig {
  webClientId?: string;
  androidClientId?: string;
  iosClientId?: string;
}

let googleAuthRequest: any = null;

export const initializeGoogleAuth = (config: GoogleAuthConfig) => {
  const [request] = Google.useAuthRequest({
    webClientId: config.webClientId,
    androidClientId: config.androidClientId,
    iosClientId: config.iosClientId,
    scopes: ['openid', 'profile', 'email'],
  });
  
  googleAuthRequest = request;
  return request;
};

export const authenticateWithGoogle = async (response: AuthSessionResult) => {
  if (response?.type !== 'success') {
    throw new Error('Google authentication was cancelled or failed');
  }
  
  const { authentication } = response;
  
  if (!authentication?.idToken) {
    throw new Error('No ID token received from Google');
  }
  
  try {
    const backendResponse = await fetch(`${apiConfig.baseUrl}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken: authentication.idToken,
      }),
    });
    
    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      throw new Error(errorData.error || 'Failed to authenticate with backend');
    }
    
    const data = await backendResponse.json();
    
    if (data.token) {
      await saveTokens(data.token, data.refresh_token, data.expires_in);
    }
    
    return data;
  } catch (error) {
    console.error('Backend Google auth error:', error);
    throw error;
  }
};

export const promptGoogleSignIn = async () => {
  if (!googleAuthRequest) {
    throw new Error('Google Auth not initialized. Call initializeGoogleAuth first.');
  }
  
  const result = await googleAuthRequest.promptAsync();
  return result;
};