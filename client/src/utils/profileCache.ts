/**
 * Profile cache utility functions
 * Handles profile data caching and retrieval
 */

import { getCachedUserData } from './storage';
import { parseFullName } from './formatters';
import { DEFAULTS } from '../constants';

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

/**
 * Load profile data from cache
 */
export const loadProfileFromCache = (): ProfileData => {
  try {
    const cachedUser = getCachedUserData<CachedUser>();
    
    if (cachedUser) {
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
    }
  } catch (error) {
    console.error('Error loading profile from cache:', error);
  }
  
  return getInitialProfileData();
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

