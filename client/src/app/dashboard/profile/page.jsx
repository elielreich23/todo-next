"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '../../../contexts/UserContext';
import styles from './profile.module.scss';

export default function ProfilePage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('details');
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: 'James',
    lastName: 'Rodriguez',
    username: 'james.rodriguez',
    email: 'pauladoe@gmail.com',
    phone: '8145762103',
    phoneCode: '+321',
    city: 'Tallin',
    country: 'Sweden',
    role: 'Frontend Developer',
    location: 'Warsaw, PL'
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
        // Build partial payload only with valid, non-empty values
        const fullName = `${(tempData.firstName || '').trim()} ${(tempData.lastName || '').trim()}`.trim();
        const payload = {};
        if (fullName) payload.full_name = fullName;
        if (tempData.username && tempData.username.trim()) payload.username = tempData.username.trim();
        if (tempData.email && tempData.email.trim()) payload.email = tempData.email.trim();

        const response = await fetch('/api/auth/profile/update/', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
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
    (async () => {
      try {
        const res = await fetch('/api/tasks/?assignedToMe=1', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) setAssignedTasks(data.tasks || []);
        }
      } catch {}
    })();
  }, [activeTab]);

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
              <p>No tasks assigned to you.</p>
            ) : (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'12px'}}>
                {assignedTasks.map(t => (
                  <div key={t.id} style={{border:'1px solid #e5e7eb',borderRadius:8,padding:12}}>
                    <div style={{fontWeight:600}}>{t.title}</div>
                    <div style={{fontSize:12,color:'#6b7280'}}>Project: {t.project_name || t.project}</div>
                    <div style={{fontSize:12,color:'#6b7280'}}>Status: {t.status}</div>
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
              <img src="/api/placeholder/120/120" alt="Profile" />
            </div>
            <div className={styles.userDetails}>
              <h2 className={styles.userName}>{profileData.firstName} {profileData.lastName}</h2>
              <p className={styles.userLocation}>{profileData.location}</p>
              <p className={styles.userRole}>({profileData.role})</p>
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
              <div className={styles.formColumn}>
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
