"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '../../../contexts/UserContext';
import styles from '../style/profile.module.scss';

export default function ProfilePage() {
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: 'User',
    lastName: '',
    username: '',
    email: 'user@example.com',
    mobile: '',
    location: '',
    zipCode: '',
    gender: '',
    role: 'User',
    country: ''
  });

  const [tempData, setTempData] = useState({ ...profileData });

  useEffect(() => {
    if (user) {
      // Update profile data with actual user data from Django backend
      setProfileData(prev => ({
        ...prev,
        firstName: user.full_name?.split(' ')[0] || user.username || 'User',
        lastName: user.full_name?.split(' ').slice(1).join(' ') || '',
        username: user.username || '',
        email: user.email || 'user@example.com'
      }));
      setTempData(prev => ({
        ...prev,
        firstName: user.full_name?.split(' ')[0] || user.username || 'User',
        lastName: user.full_name?.split(' ').slice(1).join(' ') || '',
        username: user.username || '',
        email: user.email || 'user@example.com'
      }));
    }
  }, [user]);

  const handleEditProfile = async () => {
    if (isEditing) {
      // Save changes
      try {
        const { remoteLogin } = useUser();
        const response = await fetch('http://localhost:8000/api/auth/profile/update/', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify({
            full_name: `${tempData.firstName} ${tempData.lastName}`.trim(),
            username: tempData.username,
            email: tempData.email
          })
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
          <button className={styles.headerButton}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5,1.5v.68C7.63,5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="currentColor"/>
            </svg>
          </button>
          <div className={styles.dateInfo}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" fill="currentColor"/>
            </svg>
            <span>19 May 2022</span>
          </div>
          <div className={styles.profilePicture}>
            <img src="/api/placeholder/40/40" alt="Profile" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <div className={styles.tabContainer}>
          <button className={`${styles.tab} ${styles.active}`}>My Details</button>
          <button className={styles.tab}>Assigned Tasks</button>
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
        {/* User Overview */}
        <div className={styles.userOverview}>
          <div className={styles.profileImage}>
            <img src="/api/placeholder/120/120" alt="Profile" />
          </div>
          <div className={styles.userInfo}>
            <h2 className={styles.userName}>{profileData.firstName} {profileData.lastName}</h2>
            <p className={styles.userRole}>({profileData.role})</p>
            <p className={styles.userLocation}>{profileData.location}, {profileData.country}</p>
          </div>
        </div>

        {/* Profile Form */}
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
                <label>Username</label>
                <input
                  type="text"
                  value={isEditing ? tempData.username : profileData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
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
                <label>Location</label>
                <input
                  type="text"
                  value={isEditing ? tempData.location : profileData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  disabled={!isEditing}
                  className={isEditing ? styles.editableInput : styles.readonlyInput}
                />
              </div>
              <div className={styles.formField}>
                <label>Gender</label>
                <select
                  value={isEditing ? tempData.gender : profileData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  disabled={!isEditing}
                  className={isEditing ? styles.editableInput : styles.readonlyInput}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
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
                <label>Mobile Number</label>
                <input
                  type="tel"
                  value={isEditing ? tempData.mobile : profileData.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                  disabled={!isEditing}
                  className={isEditing ? styles.editableInput : styles.readonlyInput}
                />
              </div>
              <div className={styles.formField}>
                <label>Zip Code</label>
                <input
                  type="text"
                  value={isEditing ? tempData.zipCode : profileData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
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
                  className={styles.saveButton}
                  onClick={handleEditProfile}
                >
                  Save Changes
                </button>
                <button 
                  className={styles.cancelButton}
                  onClick={handleCancel}
                >
                  Cancel
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
      </div>
    </div>
  );
}
