import { API_BASE_URL, API_ENDPOINTS, STORAGE_KEYS } from '../constants';
import { getAccessToken, setAccessToken, clearAuthTokens, getRefreshToken } from '../utils/storage';
import { CUSTOM_EVENTS } from '../constants';

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = getAccessToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Track if we're currently refreshing to prevent infinite loops
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  // Check if user has a token before making request
  const token = getAccessToken();
  // Don't redirect on initial check - let the error handling and retry logic handle it
  // This prevents premature redirects during token refresh

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...getAuthHeaders(),
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  
  if (!res.ok) {
    // Handle authentication errors
    if (res.status === 401) {
      // Check if we're already on signin page to prevent redirect loops
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      if (currentPath.includes('/auth/signin')) {
        // Already on signin page, don't redirect again
        const message = await res.text().catch(() => res.statusText);
        throw new Error(message || 'Authentication failed.');
      }

      // Prevent infinite refresh loops
      if (isRefreshing && refreshPromise) {
        // Wait for ongoing refresh to complete
        const newToken = await refreshPromise;
        if (!newToken) {
          // Refresh failed, only redirect if not already on signin
          if (!currentPath.includes('/auth/signin')) {
            window.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.USER_LOGOUT));
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/signin';
            }
          }
          throw new Error('Authentication failed. Please log in again.');
        }
      } else if (!isRefreshing) {
        // Check if we have a refresh token
        const refreshTokenValue = getRefreshToken();
        if (!refreshTokenValue) {
          // No refresh token, redirect to login
          window.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.USER_LOGOUT));
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/signin';
          }
          const message = await res.text().catch(() => res.statusText);
          throw new Error(message || 'Authentication failed. Please log in.');
        }

        // Start new refresh
        isRefreshing = true;
        refreshPromise = refreshToken();
        
        try {
          const newToken = await refreshPromise;
          if (!newToken) {
            // Refresh failed, redirect to login
            isRefreshing = false;
            refreshPromise = null;
            if (!currentPath.includes('/auth/signin')) {
              window.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.USER_LOGOUT));
              if (typeof window !== 'undefined') {
                window.location.href = '/auth/signin';
              }
            }
            throw new Error('Authentication failed. Please log in again.');
          }
          
          // Retry the request with new token
          const retryRes = await fetch(`${API_BASE_URL}${path}`, {
            ...init,
            headers: {
              ...getAuthHeaders(),
              ...(init?.headers || {}),
            },
            cache: 'no-store',
          });
          
          isRefreshing = false;
          refreshPromise = null;
          
          if (!retryRes.ok) {
            // If retry still fails with 401, redirect to login
            if (retryRes.status === 401) {
              if (!currentPath.includes('/auth/signin')) {
                window.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.USER_LOGOUT));
                if (typeof window !== 'undefined') {
                  window.location.href = '/auth/signin';
                }
              }
            }
            const message = await retryRes.text().catch(() => retryRes.statusText);
            throw new Error(message || `Request failed: ${retryRes.status}`);
          }
          
          if (retryRes.status === 204) return undefined as unknown as T;
          return retryRes.json() as Promise<T>;
        } catch (error) {
          isRefreshing = false;
          refreshPromise = null;
          throw error;
        }
      } else {
        // Shouldn't happen, but handle it
        throw new Error('Authentication failed. Please log in again.');
      }
    }
    
    const message = await res.text().catch(() => res.statusText);
    throw new Error(message || `Request failed: ${res.status}`);
  }
  
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

// Helper function to refresh token
export const refreshToken = async (): Promise<string | null> => {
  try {
    const refreshTokenValue = getRefreshToken();
    if (!refreshTokenValue) {
      console.log('No refresh token available');
      return null;
    }
    
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.TOKEN_REFRESH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshTokenValue }),
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.access) {
        setAccessToken(data.access);
        console.log('Token refreshed successfully');
        return data.access;
      } else {
        console.error('Token refresh response missing access token');
        return null;
      }
    } else {
      // Refresh failed, clear tokens and trigger logout
      console.log('Token refresh failed with status:', response.status);
      clearAuthTokens();
      sessionStorage.clear();
      
      // Dispatch logout event
      window.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.USER_LOGOUT));
      
      // Don't redirect here - let the calling code handle it to avoid loops
      return null;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    clearAuthTokens();
    return null;
  }
};


