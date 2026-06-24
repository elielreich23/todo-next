/**
 * Application-wide constants
 * Centralizes magic values and configuration
 */

// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
export const API_ENDPOINTS = {
  AUTH: {
    CONTACT: '/api/auth/contact/',
    SIGNIN: '/api/auth/signin/',
    SIGNUP: '/api/auth/signup/',
    PROFILE: '/api/auth/profile/',
    PROFILE_UPDATE: '/api/auth/profile/update/',
    TOKEN_REFRESH: '/api/token/refresh/',
    USERS_LIST: '/api/auth/users/',
    USERS_SEARCH: '/api/auth/users/search/',
    PASSWORD_RESET_REQUEST: '/api/auth/password/reset/request/',
    PASSWORD_RESET: '/api/auth/password/reset/',
    GOOGLE_AUTH: '/api/auth/google/',
    LOGOUT: '/api/auth/logout/',
    SESSIONS_LIST: '/api/auth/sessions/',
    SESSIONS_REVOKE: '/api/auth/sessions/revoke/',
    SESSIONS_REVOKE_ALL: '/api/auth/sessions/revoke-all/',
  },
  TASKS: {
    LIST: '/api/tasks/',
    DETAIL: (id: number) => `/api/tasks/${id}/`,
  },
  PROJECTS: {
    LIST: '/api/projects/',
    DETAIL: (id: number) => `/api/projects/${id}/`,
  },
  CALENDAR: {
    EVENTS: '/api/calendar/events/',
    EVENT_DETAIL: (id: number) => `/api/calendar/events/${id}/`,
  },
  NOTIFICATIONS: {
    LIST: '/api/notifications/',
    UNREAD: '/api/notifications/unread/',
    MARK_READ: (id: number) => `/api/notifications/${id}/read/`,
    MARK_ALL_READ: '/api/notifications/read-all/',
  },
  UPLOADS: {
    LIST: '/api/uploads/',
    DETAIL: (id: number) => `/api/uploads/${id}/`,
  },
  TEAM: {
    OVERVIEW: '/api/auth/team/',
    INVITE: '/api/auth/team/invitations/',
    INVITATION_DETAIL: (id: string) => `/api/auth/team/invitations/${id}/`,
    MEMBER_DETAIL: (id: number) => `/api/auth/team/members/${id}/`,
  },
} as const;

// LocalStorage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  CACHED_USER_DATA: 'cached_user_data',
  CACHED_USER_TIMESTAMP: 'cached_user_timestamp',
  CACHED_PROFILE_DATA: 'cached_profile_data',
} as const;

// Cache Configuration
export const CACHE_DURATION = {
  USER_DATA: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
} as const;

// File Upload Configuration
export const FILE_UPLOAD = {
  MAX_SIZE_BYTES: 200 * 1024 * 1024, // 200MB
  MAX_SIZE_MB: 200,
} as const;

// Task Status Values
export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in-progress',
  DONE: 'done',
} as const;

// Task Priority Values
export const TASK_PRIORITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

export const TASK_PRIORITY_OPTIONS = ['High', 'Medium', 'Low'] as const;

// Task Categories
export const TASK_CATEGORIES = [
  'Design',
  'Development',
  'Marketing',
  'Research',
  'UX',
  'Content',
] as const;

// Project Categories
export const PROJECT_CATEGORIES = [
  'Design',
  'Development',
  'Marketing',
  'Research',
] as const;

// Task Duration Options
export const TASK_DURATION_OPTIONS = [
  '1 day',
  '3 days',
  '1 week',
  '2 weeks',
  '1 month',
] as const;

// Project Duration Options
export const PROJECT_DURATION_OPTIONS = [
  '1 week',
  '2 weeks',
  '1 month',
  '3 months',
  '6 months',
] as const;

// Country Options
export const COUNTRIES = [
  { code: '+321', flag: '🇸🇪', name: 'Sweden' },
  { code: '+1', flag: '🇺🇸', name: 'United States' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+48', flag: '🇵🇱', name: 'Poland' },
] as const;

// Default Values
export const DEFAULTS = {
  PHONE_CODE: '+1',
  PROJECT_NAME: 'New Project',
  UNKNOWN_USER: 'Unknown User',
  USER_DISPLAY_NAME: 'User',
  NOT_SET: 'Not set',
} as const;

// Event Names
export const CUSTOM_EVENTS = {
  USER_DATA_UPDATED: 'userDataUpdated',
  USER_LOGOUT: 'userLogout',
} as const;

// Validation
export const VALIDATION = {
  USERNAME_REGEX: /^[A-z][A-z0-9-_]{3,23}$/,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/,
  MAX_CONTRIBUTORS: 3,
} as const;
