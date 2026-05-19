/**
 * Profile cache utility functions
 * Handles profile data caching and retrieval
 */

import { getCachedUserData, getStorageItem, setStorageItem } from './storage';
import { parseFullName } from './formatters';
import { DEFAULTS, STORAGE_KEYS } from '../constants';

export interface ProfileData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  phoneCode: string;
  city: string;
  country: string;
  role: string;
  location: string;
}

interface CachedUser {
  full_name?: string;
  username?: string;
  email?: string;
}

/**
 * Get initial empty profile data
 */
export const getInitialProfileData = (): ProfileData => ({
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  phone: '',
  phoneCode: DEFAULTS.PHONE_CODE,
  city: '',
  country: '',
  role: '',
  location: '',
});

const getProfileFromUserCache = (): ProfileData => {
  const cachedUser = getCachedUserData<CachedUser>();
  if (!cachedUser) {
    return getInitialProfileData();
  }

  const { firstName, lastName } = parseFullName(cachedUser.full_name);
  return {
    firstName,
    lastName,
    username: cachedUser.username || '',
    email: cachedUser.email || '',
    phone: '',
    phoneCode: DEFAULTS.PHONE_CODE,
    city: '',
    country: '',
    role: '',
    location: '',
  };
};

/**
 * Load profile data from cache (extended fields + auth user fields)
 */
export const loadProfileFromCache = (): ProfileData => {
  try {
    const userBased = getProfileFromUserCache();
    const stored = getStorageItem(STORAGE_KEYS.CACHED_PROFILE_DATA);

    if (stored) {
      const parsed = JSON.parse(stored) as ProfileData;
      return {
        ...userBased,
        ...parsed,
        username: parsed.username || userBased.username,
        email: parsed.email || userBased.email,
        firstName: parsed.firstName || userBased.firstName,
        lastName: parsed.lastName || userBased.lastName,
      };
    }

    if (hasProfileData(userBased)) {
      return userBased;
    }
  } catch (error) {
    console.error('Error loading profile from cache:', error);
  }

  return getInitialProfileData();
};

/**
 * Persist full profile form data locally (phone, city, country, etc.)
 */
export const saveProfileToCache = (data: ProfileData): boolean => {
  try {
    return setStorageItem(STORAGE_KEYS.CACHED_PROFILE_DATA, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving profile to cache:', error);
    return false;
  }
};

/**
 * Check if profile data has meaningful content
 */
export const hasProfileData = (data: ProfileData): boolean => {
  return !!(data.firstName || data.lastName || data.email || data.username);
};

/**
 * Create profile data from user object
 */
export const createProfileDataFromUser = (
  user: { full_name?: string; username?: string; email?: string },
  existingData?: Partial<ProfileData>
): ProfileData => {
  const { firstName, lastName } = parseFullName(user.full_name);

  return {
    firstName,
    lastName,
    username: user.username || '',
    email: user.email || '',
    phone: existingData?.phone || '',
    phoneCode: existingData?.phoneCode || DEFAULTS.PHONE_CODE,
    city: existingData?.city || '',
    country: existingData?.country || '',
    role: existingData?.role || '',
    location: existingData?.location || '',
  };
};
