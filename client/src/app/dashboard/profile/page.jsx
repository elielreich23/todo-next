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
import { API_ENDPOINTS, API_BASE_URL, DEFAULTS, CUSTOM_EVENTS, STORAGE_KEYS } from '../../../constants';
import { getAccessToken } from '../../../utils/storage';
import NotificationBell from '../../../components/NotificationBell/NotificationBell';

export default function ProfilePage() {
  const { user, isLoading: userLoading } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('details');
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  const [profileData, setProfileData] = useState(() => loadProfileFromCache());
  const [tempData, setTempData] = useState(() => loadProfileFromCache());

  // Check authentication on mount
  useEffect(() => {
    if (!userLoading && !user) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) {
        router.push('/auth/signin');
      }
    }
  }, [user, userLoading, router]);

  // Function to update profile data from user
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

  // Update profile data when user context changes
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

  // Listen for storage changes and custom events (when user data is cached from signup/login)
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

  // Check cache on mount to ensure we have the latest data (especially after refresh)
  useEffect(() => {
    const cachedData = loadProfileFromCache();
    if (hasProfileData(cachedData)) {
      setProfileData(cachedData);
      setTempData(cachedData);
    }
  }, []);

  const handleEditProfile = async () => {
    if (isEditing) {
      // Save changes
      try {
        // Build partial payload only with valid, non-empty values
        const fullName = `${(tempData.firstName || '').trim()} ${(tempData.lastName || '').trim()}`.trim();
        const payload = {};
        if (fullName) payload.full_name = fullName;
        if (tempData.username && tempData.username.trim()) payload.username = tempData.username.trim();
        if (tempData.email && tempData.email.trim()) payload.email = tempData.email.trim();

        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.PROFILE_UPDATE}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAccessToken()}`
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          setProfileData({ ...tempData });
          setIsEditing(false);
          console.log('Profile updated successfully');
        } else {
          console.error('Failed to update profile');
        }
      } catch (error) {
        console.error('Error updating profile:', error);
      }
    } else {
      // Enter edit mode
      setTempData({ ...profileData });
      setIsEditing(true);
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
  };

  useEffect(() => {
    if (activeTab !== 'assigned') return;
    if (!user || userLoading) return;

    const fetchAssignedTasks = async () => {
      try {
        // Fetch tasks assigned to the current user (or the user whose profile is being viewed)
        const userId = user?.id;
        const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TASKS.LIST}?userId=${userId}`, {
          headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) setAssignedTasks(data.tasks || []);
        }
      } catch (error) {
        console.error('Error fetching assigned tasks:', error);
      }
    };

    fetchAssignedTasks();
  }, [activeTab, user, userLoading]);

  return (
    <div className={styles.profilePage}>
      {/* Header */}
      <div className={styles.header}>
        <h1>Profile Management</h1>
        <div className={styles.headerActions}>
          <button className={styles.headerButton}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/>
            </svg>
          </button>
          <NotificationBell />
          <div className={styles.dateInfo}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" fill="currentColor"/>
            </svg>
            <span>19 May 2022</span>
          </div>
          <div className={styles.profilePicture}>
            <Image src="/api/placeholder/40/40" alt="Profile" width={40} height={40} />
          </div>
        </div>
      </div>

      {/* Main Tabs */}
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

      {/* Profile Content */}
      <div className={styles.profileContent}>
        {activeTab === 'assigned' ? (
          <div>
            {assignedTasks.length === 0 ? (
              <div className={styles.emptyTasks}>
                <p>No tasks assigned to this user.</p>
              </div>
            ) : (
              <div className={styles.tasksGrid}>
                {assignedTasks.map(t => (
                  <div key={t.id} className={styles.taskCard}>
                    <div className={styles.taskTitle}>{t.title}</div>
                    {t.description && (
                      <div className={styles.taskDescription}>{t.description}</div>
                    )}
                    <div className={styles.taskMeta}>
                      <div className={styles.taskMetaItem}>
                        <span className={styles.taskLabel}>Project:</span>
                        <span className={styles.taskValue}>{t.project_name || t.project || 'N/A'}</span>
                      </div>
                      <div className={styles.taskMetaItem}>
                        <span className={styles.taskLabel}>Status:</span>
                        <span className={`${styles.taskStatus} ${styles[`status${t.status === 'todo' ? 'Todo' : t.status === 'in_progress' ? 'InProgress' : t.status === 'completed' ? 'Completed' : ''}`]}`}>
                          {t.status?.replace('_', ' ') || 'N/A'}
                        </span>
                      </div>
                      {t.priority && (
                        <div className={styles.taskMetaItem}>
                          <span className={styles.taskLabel}>Priority:</span>
                          <span className={`${styles.taskPriority} ${styles[`priority${t.priority?.charAt(0).toUpperCase() + t.priority?.slice(1)}`]}`}>
                            {t.priority || 'N/A'}
                          </span>
                        </div>
                      )}
                      {t.due_date && (
                        <div className={styles.taskMetaItem}>
                          <span className={styles.taskLabel}>Due:</span>
                          <span className={styles.taskValue}>
                            {new Date(t.due_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
        <>
        {/* Profile Header with Banner */}
        <div className={styles.profileHeader}>
          <div className={styles.bannerImage}>
            <div className={styles.bannerOverlay}></div>
          </div>
          <div className={styles.profileInfo}>
            <div className={styles.profileImage}>
              <Image src="/api/placeholder/120/120" alt="Profile" width={120} height={120} />
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

        {/* Profile Sub-tabs */}
        <div className={styles.subTabs}>
          <button className={`${styles.subTab} ${activeSubTab==='overview' ? styles.active : ''}`} onClick={()=>setActiveSubTab('overview')}>Profile Overview</button>
          <button className={`${styles.subTab} ${activeSubTab==='summary' ? styles.active : ''}`} onClick={()=>setActiveSubTab('summary')}>Your Summary</button>
          <button className={`${styles.subTab} ${activeSubTab==='settings' ? styles.active : ''}`} onClick={()=>setActiveSubTab('settings')}>Account Settings</button>
        </div>

        {/* Profile Content based on active sub-tab */}
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

            {/* Action Buttons */}
            <div className={styles.actionButtons}>
              {isEditing ? (
                <>
                  <button
                    className={styles.cancelButton}
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                  <button
                    className={styles.saveButton}
                    onClick={handleEditProfile}
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  className={styles.editButton}
                  onClick={handleEditProfile}
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        )}

        {activeSubTab === 'summary' && (
          <div className={styles.profileForm}>
            <h3>Your Summary</h3>
            <p>This section will contain your activity summary, statistics, and achievements.</p>
            <div className={styles.summaryContent}>
              <div className={styles.summaryCard}>
                <h4>Tasks Completed</h4>
                <p className={styles.summaryNumber}>24</p>
              </div>
              <div className={styles.summaryCard}>
                <h4>Projects Active</h4>
                <p className={styles.summaryNumber}>3</p>
              </div>
              <div className={styles.summaryCard}>
                <h4>This Month</h4>
                <p className={styles.summaryNumber}>8</p>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'settings' && (
          <div className={styles.profileForm}>
            <h3>Account Settings</h3>
            <p>Manage your account preferences and security settings.</p>
            <div className={styles.settingsContent}>
              <div className={styles.settingItem}>
                <label>Email Notifications</label>
                <input type="checkbox" defaultChecked />
              </div>
              <div className={styles.settingItem}>
                <label>Two-Factor Authentication</label>
                <input type="checkbox" />
              </div>
              <div className={styles.settingItem}>
                <label>Dark Mode</label>
                <input type="checkbox" />
              </div>
            </div>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}
