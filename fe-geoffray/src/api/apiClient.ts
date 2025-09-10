import { apiConfig } from './config';
import { getAuthHeader, isTokenExpired, refreshAccessToken } from './authApi';

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
      // Handle 401 Unauthorized errors specifically for token expiration
      if (response.status === 401 && requireAuth) {
        // Try to refresh the token
        const newToken = await refreshAccessToken();
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
        }
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
      // Handle 401 Unauthorized errors specifically for token expiration
      if (response.status === 401 && requireAuth) {
        // Try to refresh the token
        const newToken = await refreshAccessToken();
        if (newToken) {
          // Retry the request with the new token
          const retryHeaders = { ...headers };
          retryHeaders['Authorization'] = `Bearer ${newToken}`;
          
          // Fixed: Use POST method for retry, not GET
          const retryResponse = await fetch(`${apiConfig.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: retryHeaders,
            body: JSON.stringify(data),
          });
          
          if (retryResponse.ok) {
            return await retryResponse.json();
          }
        }
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
      // Handle 401 Unauthorized errors specifically for token expiration
      if (response.status === 401 && requireAuth) {
        // Try to refresh the token
        const newToken = await refreshAccessToken();
        if (newToken) {
          // Retry the request with the new token
          const retryHeaders = { ...headers };
          retryHeaders['Authorization'] = `Bearer ${newToken}`;
          
          // Fixed: Use PUT method for retry, not GET
          const retryResponse = await fetch(`${apiConfig.baseUrl}${endpoint}`, {
            method: 'PUT',
            headers: retryHeaders,
            body: JSON.stringify(data),
          });
          
          if (retryResponse.ok) {
            return await retryResponse.json();
          }
        }
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
      // Handle 401 Unauthorized errors specifically for token expiration
      if (response.status === 401 && requireAuth) {
        // Try to refresh the token
        const newToken = await refreshAccessToken();
        if (newToken) {
          // Retry the request with the new token
          const retryHeaders = { ...headers };
          retryHeaders['Authorization'] = `Bearer ${newToken}`;
          
          // Fixed: Use DELETE method for retry, not GET
          const retryResponse = await fetch(`${apiConfig.baseUrl}${endpoint}`, {
            method: 'DELETE',
            headers: retryHeaders,
          });
          
          if (retryResponse.ok) {
            return await retryResponse.json();
          }
        }
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    return await response.json();
  },
};
