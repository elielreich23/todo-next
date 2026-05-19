/**
 * Storage utility functions
 * Centralizes localStorage operations with error handling
 */

import { STORAGE_KEYS } from '../constants';

/**
 * Safely get item from localStorage
 */
export const getStorageItem = (key: string): string | null => {
  try {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return null;
  }
};

/**
 * Safely set item in localStorage
 */
export const setStorageItem = (key: string, value: string): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Error writing to localStorage (${key}):`, error);
    return false;
  }
};

/**
 * Safely remove item from localStorage
 */
export const removeStorageItem = (key: string): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error);
    return false;
  }
};

/**
 * Get access token from localStorage
 */
export const getAccessToken = (): string | null => {
  return getStorageItem(STORAGE_KEYS.ACCESS_TOKEN);
};

/**
 * Get refresh token from localStorage
 */
export const getRefreshToken = (): string | null => {
  return getStorageItem(STORAGE_KEYS.REFRESH_TOKEN);
};

/**
 * Set access token in localStorage
 */
export const setAccessToken = (token: string): boolean => {
  return setStorageItem(STORAGE_KEYS.ACCESS_TOKEN, token);
};

/**
 * Set refresh token in localStorage
 */
export const setRefreshToken = (token: string): boolean => {
  return setStorageItem(STORAGE_KEYS.REFRESH_TOKEN, token);
};

/**
 * Clear all authentication tokens
 */
export const clearAuthTokens = (): void => {
  removeStorageItem(STORAGE_KEYS.ACCESS_TOKEN);
  removeStorageItem(STORAGE_KEYS.REFRESH_TOKEN);
};

/**
 * Get cached user data
 */
export const getCachedUserData = <T>(): T | null => {
  const cachedData = getStorageItem(STORAGE_KEYS.CACHED_USER_DATA);
  if (!cachedData) return null;

  try {
    return JSON.parse(cachedData) as T;
  } catch (error) {
    console.error('Error parsing cached user data:', error);
    removeStorageItem(STORAGE_KEYS.CACHED_USER_DATA);
    return null;
  }
};

/**
 * Set cached user data
 */
export const setCachedUserData = <T>(data: T): boolean => {
  try {
    const serialized = JSON.stringify(data);
    const timestamp = Date.now().toString();

    const success = setStorageItem(STORAGE_KEYS.CACHED_USER_DATA, serialized) &&
                   setStorageItem(STORAGE_KEYS.CACHED_USER_TIMESTAMP, timestamp);

    if (success) {
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('userDataUpdated'));
    }

    return success;
  } catch (error) {
    console.error('Error caching user data:', error);
    return false;
  }
};

/**
 * Clear cached user data
 */
export const clearCachedUserData = (): void => {
  removeStorageItem(STORAGE_KEYS.CACHED_USER_DATA);
  removeStorageItem(STORAGE_KEYS.CACHED_USER_TIMESTAMP);
  removeStorageItem(STORAGE_KEYS.CACHED_PROFILE_DATA);
};
