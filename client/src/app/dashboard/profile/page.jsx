"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useUser } from '../../../contexts/UserContext';
import styles from './profile.module.scss';
import {
  getInitialProfileData,
  loadProfileFromCache,
  hasProfileData,
  createProfileDataFromUser,
} from '../../../utils/profileCache';
import { getUserDisplayName } from '../../../utils/formatters';
import { api } from '../../../lib/api';
import { API_ENDPOINTS, DEFAULTS, CUSTOM_EVENTS, STORAGE_KEYS } from '../../../constants';
import { saveProfileToCache } from '../../../utils/profileCache';
import ProfileAssignedTasks from './ProfileAssignedTasks';
import ProfileSummary from './ProfileSummary';
import AvatarUpload from '../../../components/AvatarUpload/AvatarUpload';

export default function ProfilePage() {
  // Profile page state separates saved profile data from temporary edits.
  const { user, setUser, isLoading: userLoading } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('details');
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);

  const [profileData, setProfileData] = useState(() => loadProfileFromCache());
  const [tempData, setTempData] = useState(() => loadProfileFromCache());

  // Keep unauthenticated visitors out while still allowing cached profile data during load.
  useEffect(() => {
    if (!userLoading && !user) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) {
        router.push('/auth/signin');
      }
    }
  }, [user, userLoading, router]);

  // Merge server user fields into the richer dashboard profile model.
  const updateProfileFromUser = useCallback((userData) => {
    if (!userData) return;

    setProfileData(prev => {
      const newProfileData = createProfileDataFromUser(userData, prev);
      return newProfileData;
    });

    setTempData(prev => {
      const newProfileData = createProfileDataFromUser(userData, prev);
      return newProfileData;
    });
  }, []);

  // Initialize tempData with notification and theme preferences from user
  useEffect(() => {
    if (user) {
      setTempData(prev => ({
        ...prev,
        notification_preferences: user.notification_preferences || {
          email: true,
          push: true,
          task_assignments: true,
          project_updates: false,
        },
        theme_preferences: user.theme_preferences || {
          dark_mode: false,
          compact_view: false,
        },
      }));
      setProfileData(prev => ({
        ...prev,
        notification_preferences: user.notification_preferences || {
          email: true,
          push: true,
          task_assignments: true,
          project_updates: false,
        },
        theme_preferences: user.theme_preferences || {
          dark_mode: false,
          compact_view: false,
        },
      }));
    }
  }, [user]);

  // Reconcile profile display from cache first, then from the authenticated user when available.
  useEffect(() => {
    const cachedData = loadProfileFromCache();
    const hasCachedData = hasProfileData(cachedData);

    if (userLoading) {
      // While loading, use cache if available and current data is empty
      if (hasCachedData) {
        setProfileData(prev => {
          // Only update if current data is empty
          if (!hasProfileData(prev)) {
            return cachedData;
          }
          return prev;
        });
        setTempData(prev => {
          if (!hasProfileData(prev)) {
            return cachedData;
          }
          return prev;
        });
      }
      return;
    }

    if (user) {
      // User is available - update profile data immediately
      updateProfileFromUser(user);
    } else {
      // No user - use cache if available, otherwise reset to empty
      if (hasCachedData) {
        setProfileData(cachedData);
        setTempData(cachedData);
      } else {
        setProfileData(getInitialProfileData());
        setTempData(getInitialProfileData());
      }
    }
  }, [user, userLoading, updateProfileFromUser]);

  // Listen for login/signup cache updates triggered elsewhere in the app.
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEYS.CACHED_USER_DATA) {
        const cachedData = loadProfileFromCache();
        if (hasProfileData(cachedData)) {
          setProfileData(cachedData);
          setTempData(cachedData);
        }
      }
    };

    const handleUserUpdate = () => {
      const cachedData = loadProfileFromCache();
      if (hasProfileData(cachedData)) {
        setProfileData(cachedData);
        setTempData(cachedData);
      }
      if (user) {
        updateProfileFromUser(user);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(CUSTOM_EVENTS.USER_DATA_UPDATED, handleUserUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(CUSTOM_EVENTS.USER_DATA_UPDATED, handleUserUpdate);
    };
  }, [user, updateProfileFromUser]);

  // Refresh from cache on mount so profile fields survive browser refreshes.
  useEffect(() => {
    const cachedData = loadProfileFromCache();
    if (hasProfileData(cachedData)) {
      setProfileData(cachedData);
      setTempData(cachedData);
    }
  }, []);

  // Edit/save toggles between local form editing and API-backed profile updates.
  const handleEditProfile = async () => {
    if (!isEditing) {
      setTempData({ ...profileData });
      setIsEditing(true);
      setSaveError(null);
      setSaveMessage(null);
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const fullName = `${(tempData.firstName || '').trim()} ${(tempData.lastName || '').trim()}`.trim();
      const payload = {};

      if (fullName) payload.full_name = fullName;
      if (tempData.email?.trim()) payload.email = tempData.email.trim();
      if (tempData.username?.trim()) payload.username = tempData.username.trim();

      // Include notification and theme preferences
      if (tempData.notification_preferences) {
        payload.notification_preferences = tempData.notification_preferences;
      }
      if (tempData.theme_preferences) {
        payload.theme_preferences = tempData.theme_preferences;
      }

      const hasLocalOnlyChanges =
        tempData.phone !== profileData.phone ||
        tempData.phoneCode !== profileData.phoneCode ||
        tempData.city !== profileData.city ||
        tempData.country !== profileData.country;

      if (Object.keys(payload).length === 0 && !hasLocalOnlyChanges) {
        setSaveError('No changes to save.');
        return;
      }

      if (!user) {
        throw new Error('You must be signed in to save your profile.');
      }

      let apiUser = user;

      if (Object.keys(payload).length > 0) {
        const response = await api(API_ENDPOINTS.AUTH.PROFILE_UPDATE, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });

        if (!response?.success || !response?.user) {
          throw new Error(response?.message || 'Failed to update profile');
        }

        apiUser = response.user;
        setUser(response.user);
      }

      const location = [tempData.city, tempData.country].filter(Boolean).join(', ');
      const updatedProfile = createProfileDataFromUser(apiUser, {
        ...tempData,
        location: location || tempData.location,
      });

      setProfileData(updatedProfile);
      setTempData(updatedProfile);
      saveProfileToCache(updatedProfile);
      setIsEditing(false);
      setSaveMessage('Profile saved successfully.');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Save account settings independently
  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const payload = {
        notification_preferences: profileData.notification_preferences,
        theme_preferences: profileData.theme_preferences,
      };

      if (!user) {
        throw new Error('You must be signed in to save your settings.');
      }

      const response = await api(API_ENDPOINTS.AUTH.PROFILE_UPDATE, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (!response?.success || !response?.user) {
        throw new Error(response?.message || 'Failed to update settings');
      }

      setUser(response.user);
      setSaveMessage('Settings saved successfully.');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setTempData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCancel = () => {
    setTempData({ ...profileData });
    setIsEditing(false);
    setSaveError(null);
    setSaveMessage(null);
  };

  const headerDate = new Date().toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className={styles.profilePage}>
      {/* Page header: search placeholder, current date, and compact user avatar. */}
      <div className={styles.header}>
        <h1>Profile Management</h1>
        <div className={styles.headerActions}>
          <button className={styles.headerButton}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/>
            </svg>
          </button>
          <div className={styles.dateInfo}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" fill="currentColor"/>
            </svg>
            <span>{headerDate}</span>
          </div>
          <div className={styles.profilePicture}>
            <Image src="/api/placeholder/40/40" alt="Profile" width={40} height={40} />
          </div>
        </div>
      </div>

      {/* Main tabs switch between personal details and assigned task workload. */}
      <div className={styles.tabs}>
        <div className={styles.tabContainer}>
          <button className={`${styles.tab} ${activeTab==='details' ? styles.active : ''}`} onClick={()=>setActiveTab('details')}>My Details</button>
          <button className={`${styles.tab} ${activeTab==='assigned' ? styles.active : ''}`} onClick={()=>setActiveTab('assigned')}>Assigned Tasks</button>
        </div>
        <div className={styles.tabActions}>
          <span>Filter</span>
          <span>Sort</span>
          <button className={styles.moreButton}>...</button>
          <button className={styles.newTemplateButton}>New template</button>
        </div>
      </div>

      {/* Active tab content: assigned tasks delegate to a focused component; details stay local. */}
      <div className={styles.profileContent}>
        {activeTab === 'assigned' ? (
          <ProfileAssignedTasks
            profileData={profileData}
            user={user}
            userLoading={userLoading}
          />
        ) : (
        <>
        {/* Profile summary banner mirrors the saved profile model. */}
        <div className={styles.profileHeader}>
          <div className={styles.bannerImage}>
            <div className={styles.bannerOverlay}></div>
          </div>
          <div className={styles.profileInfo}>
            <div className={styles.profileImage}>
              <AvatarUpload
                currentAvatar={user?.avatar_url}
                onAvatarChange={(updatedUser) => setUser(updatedUser)}
                isLoading={isSaving}
              />
            </div>
            <div className={styles.userDetails}>
              <h2 className={styles.userName}>
                {userLoading ? 'Loading...' : getUserDisplayName(
                  profileData.firstName,
                  profileData.lastName,
                  profileData.username || user?.username,
                  profileData.email || user?.email,
                  DEFAULTS.USER_DISPLAY_NAME
                )}
              </h2>
              <p className={styles.userLocation}>{profileData.location || DEFAULTS.NOT_SET}</p>
              <p className={styles.userRole}>{profileData.role ? `(${profileData.role})` : ''}</p>
            </div>
            <button className={styles.moreOptions}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Sub-tabs organize profile details, summary placeholders, and account preferences. */}
        <div className={styles.subTabs}>
          <button className={`${styles.subTab} ${activeSubTab==='overview' ? styles.active : ''}`} onClick={()=>setActiveSubTab('overview')}>Profile Overview</button>
          <button className={`${styles.subTab} ${activeSubTab==='summary' ? styles.active : ''}`} onClick={()=>setActiveSubTab('summary')}>Your Summary</button>
          <button className={`${styles.subTab} ${activeSubTab==='settings' ? styles.active : ''}`} onClick={()=>setActiveSubTab('settings')}>Account Settings</button>
        </div>

        {/* Overview form uses tempData while editing and profileData while read-only. */}
        {activeSubTab === 'overview' && (
          <div className={styles.profileForm}>
            <div className={styles.formRow}>
              <div className={styles.formColumn}>
                <div className={styles.formField}>
                  <label>First Name</label>
                  <input
                    type="text"
                    value={isEditing ? tempData.firstName : profileData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    disabled={!isEditing}
                    className={isEditing ? styles.editableInput : styles.readonlyInput}
                  />
                </div>
                <div className={styles.formField}>
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={isEditing ? tempData.email : profileData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing}
                    className={isEditing ? styles.editableInput : styles.readonlyInput}
                  />
                </div>
                <div className={styles.formField}>
                  <label>Phone Number</label>
                  <div className={styles.phoneInput}>
                    <select
                      value={isEditing ? tempData.phoneCode : profileData.phoneCode}
                      onChange={(e) => handleInputChange('phoneCode', e.target.value)}
                      disabled={!isEditing}
                      className={styles.countrySelect}
                    >
                      <option value="+321">🇸🇪 +321</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+49">🇩🇪 +49</option>
                    </select>
                    <input
                      type="tel"
                      value={isEditing ? tempData.phone : profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      className={isEditing ? styles.editableInput : styles.readonlyInput}
                    />
                  </div>
                </div>
              </div>
              <div className={styles.formColumn}>
                <div className={styles.formField}>
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={isEditing ? tempData.lastName : profileData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    disabled={!isEditing}
                    className={isEditing ? styles.editableInput : styles.readonlyInput}
                  />
                </div>
                <div className={styles.formField}>
                  <label>Country</label>
                  <div className={styles.countryInput}>
                    <select
                      value={isEditing ? tempData.country : profileData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      disabled={!isEditing}
                      className={isEditing ? styles.editableInput : styles.readonlyInput}
                    >
                      <option value="Sweden">🇸🇪 Sweden</option>
                      <option value="United States">🇺🇸 United States</option>
                      <option value="United Kingdom">🇬🇧 United Kingdom</option>
                      <option value="Germany">🇩🇪 Germany</option>
                      <option value="Poland">🇵🇱 Poland</option>
                    </select>
                  </div>
                </div>
                <div className={styles.formField}>
                  <label>City</label>
                  <input
                    type="text"
                    value={isEditing ? tempData.city : profileData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    disabled={!isEditing}
                    className={isEditing ? styles.editableInput : styles.readonlyInput}
                  />
                </div>
              </div>
            </div>

            {(saveError || saveMessage) && (
              <p className={saveError ? styles.saveError : styles.saveSuccess} role="alert">
                {saveError || saveMessage}
              </p>
            )}

            {/* Edit actions preserve cancel/save behavior around the temporary form buffer. */}
            <div className={styles.actionButtons}>
              {isEditing ? (
                <>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={styles.saveButton}
                    onClick={handleEditProfile}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className={styles.editButton}
                  onClick={handleEditProfile}
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        )}

        {/* Summary section with real statistics from backend API */}
        {activeSubTab === 'summary' && (
          <ProfileSummary user={user} />
        )}

        {/* Account settings with persistent preferences */}
        {activeSubTab === 'settings' && (
          <div className={styles.profileForm}>
            <h3>Account Settings</h3>
            <p>Manage your account preferences and security settings.</p>
            <div className={styles.settingsContent}>
              <div className={styles.settingItem}>
                <label>Email Notifications</label>
                <input
                  type="checkbox"
                  checked={profileData.notification_preferences?.email ?? true}
                  onChange={(e) => handleInputChange('notification_preferences', {
                    ...profileData.notification_preferences,
                    email: e.target.checked
                  })}
                />
              </div>
              <div className={styles.settingItem}>
                <label>Push Notifications</label>
                <input
                  type="checkbox"
                  checked={profileData.notification_preferences?.push ?? true}
                  onChange={(e) => handleInputChange('notification_preferences', {
                    ...profileData.notification_preferences,
                    push: e.target.checked
                  })}
                />
              </div>
              <div className={styles.settingItem}>
                <label>Task Assignment Notifications</label>
                <input
                  type="checkbox"
                  checked={profileData.notification_preferences?.task_assignments ?? true}
                  onChange={(e) => handleInputChange('notification_preferences', {
                    ...profileData.notification_preferences,
                    task_assignments: e.target.checked
                  })}
                />
              </div>
              <div className={styles.settingItem}>
                <label>Project Update Notifications</label>
                <input
                  type="checkbox"
                  checked={profileData.notification_preferences?.project_updates ?? false}
                  onChange={(e) => handleInputChange('notification_preferences', {
                    ...profileData.notification_preferences,
                    project_updates: e.target.checked
                  })}
                />
              </div>
              <div className={styles.settingItem}>
                <label>Dark Mode</label>
                <input
                  type="checkbox"
                  checked={profileData.theme_preferences?.dark_mode ?? false}
                  onChange={(e) => handleInputChange('theme_preferences', {
                    ...profileData.theme_preferences,
                    dark_mode: e.target.checked
                  })}
                />
              </div>
              <div className={styles.settingItem}>
                <label>Compact View</label>
                <input
                  type="checkbox"
                  checked={profileData.theme_preferences?.compact_view ?? false}
                  onChange={(e) => handleInputChange('theme_preferences', {
                    ...profileData.theme_preferences,
                    compact_view: e.target.checked
                  })}
                />
              </div>
            </div>

            <div className={styles.actionButtons}>
              <button
                type="button"
                className={styles.saveButton}
                onClick={handleSaveSettings}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}
