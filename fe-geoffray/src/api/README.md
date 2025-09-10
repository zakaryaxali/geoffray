# Rendez-vous API Integration

This directory contains the API integration layer for the Rendez-vous application, following React Native Expo best practices.

## Authentication API

The authentication API provides methods for user authentication with the backend:

- `login(email, password)`: Authenticates a user with email and password, returning access and refresh tokens
- `saveTokens(accessToken, refreshToken, expiresIn)`: Securely stores the authentication tokens and expiration time
- `getToken()`: Retrieves the stored access token
- `getRefreshToken()`: Retrieves the stored refresh token
- `isTokenExpired()`: Checks if the current access token is expired
- `refreshAccessToken()`: Uses the refresh token to obtain a new access token
- `removeTokens()`: Removes all stored authentication tokens
- `isAuthenticated()`: Checks if a user is currently authenticated
- `getAuthHeader()`: Gets the authorization header with bearer token for API requests
- `logout()`: Invalidates the refresh token on the server and clears local tokens

## API Client

The API client provides generic methods for making HTTP requests to the backend with automatic token refresh:

- `get(endpoint, requireAuth)`: Makes a GET request
- `post(endpoint, data, requireAuth)`: Makes a POST request
- `put(endpoint, data, requireAuth)`: Makes a PUT request
- `delete(endpoint, requireAuth)`: Makes a DELETE request

All methods automatically:
1. Check if the access token is expired before making the request
2. Refresh the token if needed
3. Retry failed requests with a new token if they fail with a 401 Unauthorized error

## Configuration

The API configuration is environment-aware and provides different settings for development, staging, and production environments:

- Development: `http://localhost:8080`
- Staging: `https://staging-api.rendez-vous.com`
- Production: `https://api.rendez-vous.com`

## Usage Example

```typescript
import { login, logout, apiClient } from '@/src/api';

// Authentication
const handleLogin = async (email, password) => {
  try {
    const response = await login(email, password);
    console.log('Logged in successfully with tokens:', {
      accessToken: response.token,
      refreshToken: '***hidden***',
      expiresIn: response.expiresIn
    });
  } catch (error) {
    console.error('Login failed:', error);
  }
};

// Making an authenticated API request (with automatic token refresh)
const fetchUserProfile = async () => {
  try {
    // If token is expired, it will be automatically refreshed
    const profile = await apiClient.get('/profile', true);
    console.log('User profile:', profile);
  } catch (error) {
    console.error('Failed to fetch profile:', error);
  }
};

// Logging out
const handleLogout = async () => {
  try {
    await logout();
    console.log('Logged out successfully');
  } catch (error) {
    console.error('Logout failed:', error);
  }
};
```

## Security

This implementation uses Expo SecureStore for securely storing authentication tokens, following best practices for handling sensitive data in React Native applications.

## Real-time Chat Streaming

The API also includes support for real-time chat streaming using Server-Sent Events (SSE):

- `useChatStream` hook handles streaming connection and message processing
- Supports proper message formatting with intelligent spacing and markdown
- Handles stream completion detection with [DONE] signal handling
- Provides UI components for typing indicators and real-time updates

This implementation works across iOS, Android, and web platforms.

## Backend Documentation

For detailed information about the backend API endpoints, refer to the documentation in the backend repository
