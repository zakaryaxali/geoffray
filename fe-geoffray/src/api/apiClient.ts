import { apiConfig } from './config';
import { getAuthHeader, isTokenExpired, refreshAccessToken, removeTokens } from './authApi';

// Global auth error handler
let globalAuthErrorHandler: ((error: string) => void) | null = null;

export const setGlobalAuthErrorHandler = (handler: (error: string) => void) => {
  globalAuthErrorHandler = handler;
};

const handleAuthError = async (statusCode: number, requireAuth: boolean) => {
  if (statusCode === 401 && requireAuth) {
    // Try to refresh the token first
    const newToken = await refreshAccessToken();
    if (!newToken) {
      // If refresh fails, clear all tokens and notify global handler
      await removeTokens();
      if (globalAuthErrorHandler) {
        globalAuthErrorHandler('Session expired. Please log in again.');
      }
      throw new Error('Authentication expired');
    }
    return newToken;
  }
  
  if (statusCode === 403) {
    if (globalAuthErrorHandler) {
      globalAuthErrorHandler('Access denied. You do not have permission for this action.');
    }
    throw new Error('Access denied');
  }
  
  return null;
};

/**
 * Generic API client for making HTTP requests
 */
export const apiClient = {
  /**
   * Make a GET request
   */
  get: async <T>(endpoint: string, requireAuth = true): Promise<T> => {
    // Check if token is expired and refresh if needed
    if (requireAuth && await isTokenExpired()) {
      const newToken = await refreshAccessToken();
      if (!newToken) {
        throw new Error('Authentication expired');
      }
    }
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (requireAuth) {
      const authHeader = await getAuthHeader();
      Object.assign(headers, authHeader);
    }

    const response = await fetch(`${apiConfig.baseUrl}${endpoint}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      // Handle auth errors with retry logic
      const newToken = await handleAuthError(response.status, requireAuth);
      if (newToken) {
        // Retry the request with the new token
        const retryHeaders = { ...headers };
        retryHeaders['Authorization'] = `Bearer ${newToken}`;
        
        const retryResponse = await fetch(`${apiConfig.baseUrl}${endpoint}`, {
          method: 'GET',
          headers: retryHeaders,
        });
        
        if (retryResponse.ok) {
          return await retryResponse.json();
        }
        
        // If retry also fails, fall through to error handling
        const retryErrorData = await retryResponse.json().catch(() => ({}));
        throw new Error(retryErrorData.message || `Retry request failed with status ${retryResponse.status}`);
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    return await response.json();
  },

  /**
   * Make a POST request
   */
  post: async <T>(endpoint: string, data: any, requireAuth = true): Promise<T> => {
    // Check if token is expired and refresh if needed
    if (requireAuth && await isTokenExpired()) {
      const newToken = await refreshAccessToken();
      if (!newToken) {
        throw new Error('Authentication expired');
      }
    }
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (requireAuth) {
      const authHeader = await getAuthHeader();
      Object.assign(headers, authHeader);
    }

    const response = await fetch(`${apiConfig.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      // Handle auth errors with retry logic
      const newToken = await handleAuthError(response.status, requireAuth);
      if (newToken) {
        // Retry the request with the new token
        const retryHeaders = { ...headers };
        retryHeaders['Authorization'] = `Bearer ${newToken}`;
        
        const retryResponse = await fetch(`${apiConfig.baseUrl}${endpoint}`, {
          method: 'POST',
          headers: retryHeaders,
          body: JSON.stringify(data),
        });
        
        if (retryResponse.ok) {
          return await retryResponse.json();
        }
        
        // If retry also fails, fall through to error handling
        const retryErrorData = await retryResponse.json().catch(() => ({}));
        throw new Error(retryErrorData.message || `Retry request failed with status ${retryResponse.status}`);
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    return await response.json();
  },

  /**
   * Make a PUT request
   */
  put: async <T>(endpoint: string, data: any, requireAuth = true): Promise<T> => {
    // Check if token is expired and refresh if needed
    if (requireAuth && await isTokenExpired()) {
      const newToken = await refreshAccessToken();
      if (!newToken) {
        throw new Error('Authentication expired');
      }
    }
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (requireAuth) {
      const authHeader = await getAuthHeader();
      Object.assign(headers, authHeader);
    }

    const response = await fetch(`${apiConfig.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      // Handle auth errors with retry logic
      const newToken = await handleAuthError(response.status, requireAuth);
      if (newToken) {
        // Retry the request with the new token
        const retryHeaders = { ...headers };
        retryHeaders['Authorization'] = `Bearer ${newToken}`;
        
        const retryResponse = await fetch(`${apiConfig.baseUrl}${endpoint}`, {
          method: 'PUT',
          headers: retryHeaders,
          body: JSON.stringify(data),
        });
        
        if (retryResponse.ok) {
          return await retryResponse.json();
        }
        
        // If retry also fails, fall through to error handling
        const retryErrorData = await retryResponse.json().catch(() => ({}));
        throw new Error(retryErrorData.message || `Retry request failed with status ${retryResponse.status}`);
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    return await response.json();
  },

  /**
   * Make a DELETE request
   */
  delete: async <T>(endpoint: string, requireAuth = true): Promise<T> => {
    // Check if token is expired and refresh if needed
    if (requireAuth && await isTokenExpired()) {
      const newToken = await refreshAccessToken();
      if (!newToken) {
        throw new Error('Authentication expired');
      }
    }
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (requireAuth) {
      const authHeader = await getAuthHeader();
      Object.assign(headers, authHeader);
    }

    const response = await fetch(`${apiConfig.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      // Handle auth errors with retry logic
      const newToken = await handleAuthError(response.status, requireAuth);
      if (newToken) {
        // Retry the request with the new token
        const retryHeaders = { ...headers };
        retryHeaders['Authorization'] = `Bearer ${newToken}`;
        
        const retryResponse = await fetch(`${apiConfig.baseUrl}${endpoint}`, {
          method: 'DELETE',
          headers: retryHeaders,
        });
        
        if (retryResponse.ok) {
          return await retryResponse.json();
        }
        
        // If retry also fails, fall through to error handling
        const retryErrorData = await retryResponse.json().catch(() => ({}));
        throw new Error(retryErrorData.message || `Retry request failed with status ${retryResponse.status}`);
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    return await response.json();
  },
};
