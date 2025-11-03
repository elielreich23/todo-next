"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../../../contexts/UserContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { api } from '../../../lib/api';
import styles from '../style/settings.module.scss';

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser, logout } = useUser();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile state
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    fullName: '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    taskReminders: true,
    projectUpdates: true,
    weeklyDigest: false,
  });

  // Account deletion
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username || '',
        email: user.email || '',
        fullName: user.fullName || '',
      });
    }

    // Load notification preferences from localStorage
    const savedNotifications = localStorage.getItem('taskero_notifications');
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch (e) {
        console.error('Error loading notifications:', e);
      }
    }
  }, [user]);

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage({ type: '', text: '' });

    if (!user || !user.id) {
      setProfileMessage({ 
        type: 'error', 
        text: 'User not found. Please log in again.' 
      });
      setProfileLoading(false);
      return;
    }

    try {
      const response = await api('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          user_id: user.id,
          username: profileForm.username,
          email: profileForm.email,
          full_name: profileForm.fullName,
        }),
      });

      // Update user context with new data
      const updatedUser = {
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        fullName: response.user.full_name || response.user.fullName,
      };
      setUser(updatedUser);
      
      setProfileMessage({ 
        type: 'success', 
        text: response.message || 'Profile updated successfully!' 
      });
      setTimeout(() => setProfileMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      const errorMessage = error.message || 'Failed to update profile';
      setProfileMessage({ 
        type: 'error', 
        text: errorMessage.includes('detail') ? JSON.parse(errorMessage).detail : errorMessage
      });
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage({ type: '', text: '' });

    if (!user || !user.id) {
      setPasswordMessage({ 
        type: 'error', 
        text: 'User not found. Please log in again.' 
      });
      setPasswordLoading(false);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ 
        type: 'error', 
        text: 'New passwords do not match' 
      });
      setPasswordLoading(false);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage({ 
        type: 'error', 
        text: 'Password must be at least 6 characters long' 
      });
      setPasswordLoading(false);
      return;
    }

    try {
      const response = await api('/api/user/password', {
        method: 'PUT',
        body: JSON.stringify({
          user_id: user.id,
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword,
          confirm_password: passwordForm.confirmPassword,
        }),
      });

      setPasswordMessage({ 
        type: 'success', 
        text: response.message || 'Password updated successfully!' 
      });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => setPasswordMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      const errorMessage = error.message || 'Failed to change password';
      const errorDetail = errorMessage.includes('detail') 
        ? (typeof errorMessage === 'string' && errorMessage.includes('{') 
           ? JSON.parse(errorMessage).detail 
           : errorMessage)
        : errorMessage;
      setPasswordMessage({ 
        type: 'error', 
        text: errorDetail || 'Failed to change password' 
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle notification preference change
  const handleNotificationChange = (key, value) => {
    const updated = { ...notifications, [key]: value };
    setNotifications(updated);
    localStorage.setItem('taskero_notifications', JSON.stringify(updated));
  };

  // Handle theme change - uses the global theme context
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme); // This will update globally via ThemeContext
  };

  // Handle account deletion
  const handleAccountDeletion = async () => {
    if (!user || !user.id) {
      alert('User not found. Please log in again.');
      return;
    }

    if (!deletePassword) {
      alert('Please enter your password to confirm account deletion');
      return;
    }

    if (!confirm('Are you absolutely sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.')) {
      return;
    }

    setDeleteLoading(true);
    try {
      const response = await api('/api/user/account', {
        method: 'DELETE',
        body: JSON.stringify({
          user_id: user.id,
          password: deletePassword,
        }),
      });

      // Account deleted successfully
      alert(response.message || 'Account deleted successfully');
      logout();
      // Redirect to home/login page
      router.push('/auth/signin');
    } catch (error) {
      const errorMessage = error.message || 'Failed to delete account';
      const errorDetail = errorMessage.includes('detail') 
        ? (typeof errorMessage === 'string' && errorMessage.includes('{') 
           ? JSON.parse(errorMessage).detail 
           : errorMessage)
        : errorMessage;
      alert('Failed to delete account: ' + errorDetail);
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
      setDeletePassword('');
    }
  };

  return (
    <div className={styles.settingsPage}>
      <div className={styles.header}>
        <h1>Settings</h1>
        <p>Manage your account settings and preferences</p>
      </div>

      <div className={styles.container}>
        {/* Sidebar Navigation */}
        <div className={styles.sidebar}>
          <button
            className={`${styles.sidebarItem} ${activeTab === 'profile' ? styles.active : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
            </svg>
            Profile
          </button>
          
          <button
            className={`${styles.sidebarItem} ${activeTab === 'password' ? styles.active : ''}`}
            onClick={() => setActiveTab('password')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" fill="currentColor"/>
            </svg>
            Password
          </button>

          <button
            className={`${styles.sidebarItem} ${activeTab === 'notifications' ? styles.active : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="currentColor"/>
            </svg>
            Notifications
          </button>

          <button
            className={`${styles.sidebarItem} ${activeTab === 'theme' ? styles.active : ''}`}
            onClick={() => setActiveTab('theme')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" fill="currentColor"/>
            </svg>
            Appearance
          </button>

          <button
            className={`${styles.sidebarItem} ${activeTab === 'danger' ? styles.active : ''} ${styles.danger}`}
            onClick={() => setActiveTab('danger')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
            </svg>
            Account
          </button>
        </div>

        {/* Content Area */}
        <div className={styles.content}>
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className={styles.tabContent}>
              <h2>Profile Information</h2>
              <p className={styles.description}>Update your personal information</p>

              <form onSubmit={handleProfileUpdate} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    value={profileForm.username}
                    onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    type="text"
                    id="fullName"
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  />
                </div>

                {profileMessage.text && (
                  <div className={`${styles.message} ${styles[profileMessage.type]}`}>
                    {profileMessage.text}
                  </div>
                )}

                <button type="submit" className={styles.submitButton} disabled={profileLoading}>
                  {profileLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className={styles.tabContent}>
              <h2>Change Password</h2>
              <p className={styles.description}>Update your password to keep your account secure</p>

              <form onSubmit={handlePasswordChange} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                    minLength={6}
                  />
                  <small>Must be at least 6 characters long</small>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                  />
                </div>

                {passwordMessage.text && (
                  <div className={`${styles.message} ${styles[passwordMessage.type]}`}>
                    {passwordMessage.text}
                  </div>
                )}

                <button type="submit" className={styles.submitButton} disabled={passwordLoading}>
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className={styles.tabContent}>
              <h2>Notification Preferences</h2>
              <p className={styles.description}>Choose what notifications you want to receive</p>

              <div className={styles.preferencesList}>
                <div className={styles.preferenceItem}>
                  <div>
                    <h3>Email Notifications</h3>
                    <p>Receive notifications via email</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={notifications.emailNotifications}
                      onChange={(e) => handleNotificationChange('emailNotifications', e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.preferenceItem}>
                  <div>
                    <h3>Task Reminders</h3>
                    <p>Get reminded about upcoming tasks</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={notifications.taskReminders}
                      onChange={(e) => handleNotificationChange('taskReminders', e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.preferenceItem}>
                  <div>
                    <h3>Project Updates</h3>
                    <p>Notify when projects are updated</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={notifications.projectUpdates}
                      onChange={(e) => handleNotificationChange('projectUpdates', e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.preferenceItem}>
                  <div>
                    <h3>Weekly Digest</h3>
                    <p>Receive a weekly summary of your activities</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={notifications.weeklyDigest}
                      onChange={(e) => handleNotificationChange('weeklyDigest', e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Theme Tab */}
          {activeTab === 'theme' && (
            <div className={styles.tabContent}>
              <h2>Appearance</h2>
              <p className={styles.description}>Customize how Taskero looks and feels</p>

              <div className={styles.themeOptions}>
                <div
                  className={`${styles.themeOption} ${theme === 'light' ? styles.active : ''}`}
                  onClick={() => handleThemeChange('light')}
                >
                  <div className={styles.themePreview}>
                    <div className={styles.themePreviewLight}>
                      <div className={styles.previewHeader}></div>
                      <div className={styles.previewContent}></div>
                    </div>
                  </div>
                  <h3>Light</h3>
                  <p>Clean and bright interface</p>
                </div>

                <div
                  className={`${styles.themeOption} ${theme === 'dark' ? styles.active : ''}`}
                  onClick={() => handleThemeChange('dark')}
                >
                  <div className={styles.themePreview}>
                    <div className={styles.themePreviewDark}>
                      <div className={styles.previewHeader}></div>
                      <div className={styles.previewContent}></div>
                    </div>
                  </div>
                  <h3>Dark</h3>
                  <p>Easier on the eyes</p>
                </div>
              </div>
            </div>
          )}

          {/* Danger Zone Tab */}
          {activeTab === 'danger' && (
            <div className={styles.tabContent}>
              <h2>Account Management</h2>
              <p className={styles.description}>Dangerous actions - proceed with caution</p>

              <div className={styles.dangerZone}>
                <div className={styles.dangerSection}>
                  <div>
                    <h3>Delete Account</h3>
                    <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
                  </div>
                  <button
                    className={styles.dangerButton}
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete Account
                  </button>
                </div>

                {showDeleteConfirm && (
                  <div className={styles.deleteConfirm}>
                    <h4>Are you absolutely sure?</h4>
                    <p>This will permanently delete your account, projects, and tasks. This action cannot be undone.</p>
                    <div className={styles.deleteForm}>
                      <input
                        type="password"
                        placeholder="Enter your password to confirm"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                      />
                      <div className={styles.deleteActions}>
                        <button
                          className={styles.cancelButton}
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeletePassword('');
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          className={styles.confirmDeleteButton}
                          onClick={handleAccountDeletion}
                          disabled={deleteLoading || !deletePassword}
                        >
                          {deleteLoading ? 'Deleting...' : 'Yes, Delete Account'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
