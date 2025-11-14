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

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
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
      // Try to refresh token first
      const newToken = await refreshToken();
      if (!newToken) {
        // Refresh failed, trigger logout
        window.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.USER_LOGOUT));
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/signin';
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
      
      if (!retryRes.ok) {
        const message = await retryRes.text().catch(() => retryRes.statusText);
        throw new Error(message || `Request failed: ${retryRes.status}`);
      }
      
      if (retryRes.status === 204) return undefined as unknown as T;
      return retryRes.json() as Promise<T>;
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
    if (!refreshTokenValue) return null;
    
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.TOKEN_REFRESH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshTokenValue }),
    });
    
    if (response.ok) {
      const data = await response.json();
      setAccessToken(data.access);
      return data.access;
    } else {
      // Refresh failed, clear tokens and trigger logout
      clearAuthTokens();
      sessionStorage.clear();
      
      // Dispatch logout event
      window.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.USER_LOGOUT));
      
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/signin';
      }
      return null;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
};


