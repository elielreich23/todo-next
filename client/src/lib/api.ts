import { API_BASE_URL, API_ENDPOINTS } from '../constants';
import { getAccessToken, setAccessToken, clearAuthTokens, getRefreshToken } from '../utils/storage';
import { CUSTOM_EVENTS } from '../constants';
import { rateLimiter, getRateLimitConfig, formatTimeRemaining } from '../utils/rateLimiter';
import { apiCache, generateCacheKey, getCacheConfig } from '../utils/cache';

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

// Track pending requests to prevent duplicate API calls
const pendingRequests = new Map<string, Promise<any>>();

// Generate a unique key for request deduplication
function getRequestKey(path: string, init?: RequestInit): string {
  const method = init?.method || 'GET';
  const body = init?.body ? JSON.stringify(JSON.parse(init.body as string)) : '';
  return `${method}:${path}:${body}`;
}

export async function api<T>(path: string, init?: RequestInit, useCache: boolean = true): Promise<T> {
  // For POST/PUT/PATCH requests, check for duplicate pending requests
  const method = init?.method || 'GET';
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  if (isMutation) {
    const requestKey = getRequestKey(path, init);
    // Check if there's already a pending request with the same key
    const pendingRequest = pendingRequests.get(requestKey);
    if (pendingRequest) {
      console.log('Duplicate request detected, reusing pending request:', requestKey);
      return pendingRequest as Promise<T>;
    }
  }
  // Check client-side rate limiting before making request
  const rateLimitKey = path;
  const rateLimitConfig = getRateLimitConfig(path);

  if (!rateLimiter.isAllowed(rateLimitKey, rateLimitConfig)) {
    const timeRemaining = rateLimiter.getTimeUntilReset(rateLimitKey);
    const timeStr = formatTimeRemaining(timeRemaining);
    // In development, log a helpful message about resetting rate limits
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Rate limit exceeded for ${rateLimitKey}. Reset with: rateLimiter.reset('${rateLimitKey}') or rateLimiter.clear()`);
    }
    throw new Error(`Too many requests. Please wait ${timeStr} before trying again.`);
  }

  // Create the request promise
  const requestPromise = (async (): Promise<T> => {
  // Check cache for GET requests
  const isGetRequest = !init?.method || init.method === 'GET';
  if (isGetRequest && useCache) {
    const cacheKey = generateCacheKey(path, init?.body ? JSON.parse(init.body as string) : undefined);
    const cachedData = apiCache.get<T>(cacheKey);
    if (cachedData !== null) {
      return cachedData;
    }
  }

  // Don't redirect on initial check - let the error handling and retry logic handle it
  // This prevents premature redirects during token refresh

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        ...getAuthHeaders(),
        ...(init?.headers || {}),
      },
      cache: 'no-store',
    });
  } catch (error) {
    // Network error (CORS, connection refused, etc.)
    console.error('Network error:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Failed to connect to server. Please ensure the backend is running at ${API_BASE_URL}`);
    }
    throw error;
  }

  if (!res.ok) {
    // Handle session expiration (401)
    if (res.status === 401) {
      // Check if it's a session expiration error
      try {
        const errorData = await res.json().catch(() => null);
        if (errorData?.message?.includes('Session expired') || errorData?.message?.includes('No active session')) {
          // Clear tokens and redirect to login
          clearAuthTokens();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.USER_LOGOUT));
            // Don't redirect here - let the component handle it
          }
          throw new Error('Session expired. Please log in again.');
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('Session expired')) {
          throw error;
        }
      }
    }

    // Handle rate limit errors (429)
    if (res.status === 429) {
      // Reset client-side rate limit to sync with server
      rateLimiter.reset(rateLimitKey);
      try {
        const errorData = await res.json().catch(() => null);
        const message = errorData?.message || errorData?.detail || 'Too many requests. Please try again later.';
        throw new Error(message);
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Too many requests. Please try again later.');
      }
    }

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
          const retryData = await retryRes.json() as T;

          // Cache successful GET responses
          if (isGetRequest && useCache && retryRes.ok) {
            const cacheKey = generateCacheKey(path, init?.body ? JSON.parse(init.body as string) : undefined);
            const cacheConfig = getCacheConfig(path);
            apiCache.set(cacheKey, retryData, cacheConfig);
          }

          return retryData;
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

    // Try to parse JSON error response first
    try {
      const errorData = await res.json();
      // Backend returns errors in format: {success: false, errors: {...}} or {success: false, message: "..."}
      if (errorData.errors) {
        // Format validation errors
        const errorMessages = Object.entries(errorData.errors)
          .map(([field, messages]: [string, any]) => {
            if (Array.isArray(messages)) {
              return `${field}: ${messages.join(', ')}`;
            }
            return `${field}: ${messages}`;
          })
          .join('; ');
        throw new Error(errorMessages || errorData.message || 'Validation failed');
      }
      throw new Error(errorData.message || errorData.detail || `Request failed: ${res.status}`);
    } catch (parseError) {
      // If JSON parsing fails, try text
      if (parseError instanceof Error && parseError.message.includes('JSON')) {
        const message = await res.text().catch(() => res.statusText);
        throw new Error(message || `Request failed: ${res.status}`);
      }
      throw parseError;
    }
  }

  if (res.status === 204) return undefined as unknown as T;
  const data = await res.json() as T;

  // Cache successful GET responses
  if (isGetRequest && useCache && res.ok) {
    const cacheKey = generateCacheKey(path, init?.body ? JSON.parse(init.body as string) : undefined);
    const cacheConfig = getCacheConfig(path);
    apiCache.set(cacheKey, data, cacheConfig);
  }

  return data;
  })();

  // For mutation requests, track the pending request
  if (isMutation) {
    const requestKey = getRequestKey(path, init);
    pendingRequests.set(requestKey, requestPromise);

    // Remove from pending requests after completion (success or error)
    requestPromise
      .then(() => {
        pendingRequests.delete(requestKey);
      })
      .catch(() => {
        pendingRequests.delete(requestKey);
      });
  }

  return requestPromise;
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
