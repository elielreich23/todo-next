import { API_BASE_URL, API_ENDPOINTS } from '../constants';
import { getAccessToken, setAccessToken, clearAuthTokens, getRefreshToken } from '../utils/storage';
import { CUSTOM_EVENTS } from '../constants';
import { rateLimiter, getRateLimitConfig, formatTimeRemaining } from '../utils/rateLimiter';
import { apiCache, generateCacheKey, getCacheConfig } from '../utils/cache';

// -------------------- CONSTANTS --------------------

const SIGNIN_PATH = '/auth/signin';
const HTTP_STATUS_UNAUTHORIZED = 401;
const HTTP_STATUS_TOO_MANY_REQUESTS = 429;
const HTTP_STATUS_NO_CONTENT = 204;

// -------------------- STATE --------------------

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;
const pendingRequests = new Map<string, Promise<any>>();

// -------------------- HELPER FUNCTIONS --------------------

/**
 * Gets authentication headers for API requests
 */
const getAuthHeaders = (body?: any): HeadersInit => {
  const token = getAccessToken();
  const headers: HeadersInit = {};

  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Generates a unique key for request deduplication
 */
const getRequestKey = (path: string, init?: RequestInit): string => {
  const method = init?.method || 'GET';
  let body = '';
  if (init?.body) {
    if (init.body instanceof FormData) {
      body = 'form-data';
    } else if (typeof init.body === 'string') {
      try {
        body = JSON.stringify(JSON.parse(init.body));
      } catch {
        body = init.body;
      }
    } else {
      body = 'other-body';
    }
  }
  return `${method}:${path}:${body}`;
};

/**
 * Checks if current path is signin page
 */
const isSigninPage = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.location.pathname.includes(SIGNIN_PATH);
};

/**
 * Handles session expiration errors
 */
const handleSessionExpiration = async (response: Response): Promise<never> => {
  try {
    const errorData = await response.json().catch(() => null);
    const isSessionExpired = errorData?.message?.includes('Session expired') ||
      errorData?.message?.includes('No active session');

    if (isSessionExpired) {
      clearAuthTokens();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.USER_LOGOUT));
      }
      throw new Error('Session expired. Please log in again.');
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Session expired')) {
      throw error;
    }
  }
  throw new Error('Session expired. Please log in again.');
};

/**
 * Handles rate limit errors
 */
const handleRateLimitError = async (response: Response, rateLimitKey: string): Promise<never> => {
  rateLimiter.reset(rateLimitKey);
  try {
    const errorData = await response.json().catch(() => null);
    const message = errorData?.message || errorData?.detail || 'Too many requests. Please try again later.';
    throw new Error(message);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Too many requests. Please try again later.');
  }
};

/**
 * Redirects to signin page
 */
const redirectToSignin = (): void => {
  if (typeof window !== 'undefined' && !isSigninPage()) {
    window.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.USER_LOGOUT));
    window.location.href = SIGNIN_PATH;
  }
};

/**
 * Handles token refresh and retries request
 */
const handleTokenRefreshAndRetry = async <T>(
  path: string,
  init: RequestInit | undefined,
  isGetRequest: boolean,
  useCache: boolean
): Promise<T> => {
  const refreshTokenValue = getRefreshToken();
  if (!refreshTokenValue) {
    redirectToSignin();
    const message = 'Authentication failed. Please log in.';
    throw new Error(message);
  }

  isRefreshing = true;
  refreshPromise = refreshToken();

  try {
    const newToken = await refreshPromise;
    if (!newToken) {
      isRefreshing = false;
      refreshPromise = null;
      redirectToSignin();
      throw new Error('Authentication failed. Please log in again.');
    }

    const retryResponse = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        ...getAuthHeaders(init?.body),
        ...(init?.headers || {}),
      },
      cache: 'no-store',
    });

    isRefreshing = false;
    refreshPromise = null;

    if (!retryResponse.ok) {
      if (retryResponse.status === HTTP_STATUS_UNAUTHORIZED) {
        redirectToSignin();
      }
      const message = await retryResponse.text().catch(() => retryResponse.statusText);
      throw new Error(message || `Request failed: ${retryResponse.status}`);
    }

    if (retryResponse.status === HTTP_STATUS_NO_CONTENT) {
      return undefined as unknown as T;
    }

    const retryData = await retryResponse.json() as T;

    if (isGetRequest && useCache && retryResponse.ok) {
      const cacheKey = generateCacheKey(path, init?.body && typeof init.body === 'string' ? JSON.parse(init.body) : undefined);
      const cacheConfig = getCacheConfig(path);
      apiCache.set(cacheKey, retryData, cacheConfig);
    }

    return retryData;
  } catch (error) {
    isRefreshing = false;
    refreshPromise = null;
    throw error;
  }
};

/**
 * Handles authentication errors (401)
 */
const handleAuthenticationError = async <T>(
  response: Response,
  path: string,
  init: RequestInit | undefined,
  isGetRequest: boolean,
  useCache: boolean
): Promise<T> => {
  if (isSigninPage()) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(message || 'Authentication failed.');
  }

  if (isRefreshing && refreshPromise) {
    const newToken = await refreshPromise;
    if (!newToken) {
      redirectToSignin();
      throw new Error('Authentication failed. Please log in again.');
    }
  } else if (!isRefreshing) {
    return handleTokenRefreshAndRetry(path, init, isGetRequest, useCache);
  }

  throw new Error('Authentication failed. Please log in again.');
};

/**
 * Parses error response from API
 */
const parseErrorResponse = async (response: Response): Promise<never> => {
  try {
    const errorData = await response.json();
    if (errorData.errors) {
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
    throw new Error(errorData.message || errorData.detail || `Request failed: ${response.status}`);
  } catch (parseError) {
    if (parseError instanceof Error && parseError.message.includes('JSON')) {
      const message = await response.text().catch(() => response.statusText);
      throw new Error(message || `Request failed: ${response.status}`);
    }
    throw parseError;
  }
};

export async function api<T>(path: string, init?: RequestInit, useCache: boolean = true): Promise<T> {
  // For POST/PUT/PATCH requests, check for duplicate pending requests
  const method = init?.method || 'GET';
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  if (isMutation) {
    const requestKey = getRequestKey(path, init);
    // Check if there's already a pending request with the same key
    const pendingRequest = pendingRequests.get(requestKey);
    if (pendingRequest) {
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
    const cacheKey = generateCacheKey(path, init?.body && typeof init.body === 'string' ? JSON.parse(init.body) : undefined);
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
        ...getAuthHeaders(init?.body),
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
    if (res.status === HTTP_STATUS_UNAUTHORIZED) {
      try {
        await handleSessionExpiration(res);
      } catch (error) {
        if (error instanceof Error && error.message.includes('Session expired')) {
          throw error;
        }
      }
      return handleAuthenticationError(res, path, init, isGetRequest, useCache);
    }

    if (res.status === HTTP_STATUS_TOO_MANY_REQUESTS) {
      return handleRateLimitError(res, rateLimitKey);
    }

    return parseErrorResponse(res);
  }

  if (res.status === 204) return undefined as unknown as T;
  const data = await res.json() as T;

  // Cache successful GET responses
  if (isGetRequest && useCache && res.ok) {
    const cacheKey = generateCacheKey(path, init?.body && typeof init.body === 'string' ? JSON.parse(init.body) : undefined);
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
        return data.access;
      } else {
        console.error('Token refresh response missing access token');
        return null;
      }
    } else {
      // Refresh failed, clear tokens and trigger logout
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
