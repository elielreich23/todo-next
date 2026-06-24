"use client";

import React, { useEffect, useState } from 'react';
import styles from './settings.module.scss';
import SessionManagement from '../../../components/SessionManagement/SessionManagement';
import { API_ENDPOINTS } from '../../../constants';
import { useUser } from '../../../contexts/UserContext';
import { api } from '../../../lib/api';

const settingsCategories = [
  { id: 'basic-info', name: 'Basic Info', icon: '👤', description: 'Manage your account information' },
  { id: 'sessions', name: 'Sessions', icon: '🔒', description: 'Manage active sessions and devices' },
  { id: 'plans-billing', name: 'Plans & Billing', icon: '💳', description: 'Manage subscription and billing' },
  { id: 'team', name: 'Team', icon: '👥', description: 'Manage team members and permissions' },
  { id: 'appearance', name: 'Appearance', icon: '🎨', description: 'Customize your interface' },
  { id: 'notifications', name: 'Notifications', icon: '🔔', description: 'Configure notification preferences' },
  { id: 'audit-trail', name: 'Audit Trail', icon: '📋', description: 'View activity logs' },
  { id: 'integrations', name: 'Integrations', icon: '🔌', description: 'Connect external services' },
];

const plans = [
  { id: 'basic', name: 'Basic Plan', price: '$9/month', subtitle: 'Up to 10 users, 20GB per user' },
  { id: 'business', name: 'Business Plan', price: '$19/month', subtitle: 'Up to 20 users, 40GB per user' },
  { id: 'enterprise', name: 'Enterprise Plan', price: '$29/month', subtitle: 'Unlimited users, 50GB per user' },
];

export default function SettingsPage() {
  const [selectedCategory, setSelectedCategory] = useState('basic-info');
  const [selectedPlan, setSelectedPlan] = useState('basic');
  const { user, setUser } = useUser();
  const [statusMessage, setStatusMessage] = useState('');
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    username: '',
    email: '',
    phone_number: '',
    bio: '',
  });
  const [notificationPrefs, setNotificationPrefs] = useState({
    email: true,
    push: true,
    task_assignments: true,
    project_updates: false,
  });
  const [teamState, setTeamState] = useState({
    team: null,
    current_role: null,
    members: [],
    invitations: [],
  });
  const [teamForm, setTeamForm] = useState({
    name: '',
    inviteEmail: '',
    inviteRole: 'member',
  });
  const [teamMessage, setTeamMessage] = useState('');
  const [teamLoading, setTeamLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      full_name: user.full_name || '',
      username: user.username || '',
      email: user.email || '',
      phone_number: user.phone_number || '',
      bio: user.bio || '',
    });
    setNotificationPrefs((prev) => ({
      ...prev,
      ...(user.notification_preferences || {}),
    }));
  }, [user]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setStatusMessage('');
    const response = await api(API_ENDPOINTS.AUTH.PROFILE_UPDATE, {
      method: 'PUT',
      body: JSON.stringify({
        ...profileForm,
        notification_preferences: notificationPrefs,
      }),
    });
    if (response.success) {
      setUser(response.user);
      setStatusMessage('Settings saved.');
    }
  };

  const updateProfileField = (field) => (event) => {
    setProfileForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const updateNotificationPref = (field) => (event) => {
    setNotificationPrefs((prev) => ({ ...prev, [field]: event.target.checked }));
  };

  const loadTeam = async () => {
    setTeamLoading(true);
    setTeamMessage('');
    try {
      const response = await api(API_ENDPOINTS.TEAM.OVERVIEW);
      if (response.success) {
        setTeamState({
          team: response.team,
          current_role: response.current_role,
          members: response.members || [],
          invitations: response.invitations || [],
        });
        setTeamForm((prev) => ({ ...prev, name: response.team?.name || '' }));
      }
    } catch (err) {
      setTeamMessage(err?.message || 'Failed to load team');
    } finally {
      setTeamLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCategory === 'team') {
      loadTeam();
    }
  }, [selectedCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveTeamName = async (event) => {
    event.preventDefault();
    setTeamMessage('');
    try {
      const response = await api(API_ENDPOINTS.TEAM.OVERVIEW, {
        method: 'PUT',
        body: JSON.stringify({ name: teamForm.name }),
      });
      if (response.success) {
        setTeamState({
          team: response.team,
          current_role: response.current_role,
          members: response.members || [],
          invitations: response.invitations || [],
        });
        setTeamMessage('Team updated.');
      }
    } catch (err) {
      setTeamMessage(err?.message || 'Failed to update team');
    }
  };

  const inviteMember = async (event) => {
    event.preventDefault();
    setTeamMessage('');
    try {
      await api(API_ENDPOINTS.TEAM.INVITE, {
        method: 'POST',
        body: JSON.stringify({ email: teamForm.inviteEmail, role: teamForm.inviteRole }),
      });
      setTeamForm((prev) => ({ ...prev, inviteEmail: '', inviteRole: 'member' }));
      setTeamMessage('Invitation sent.');
      await loadTeam();
    } catch (err) {
      setTeamMessage(err?.message || 'Failed to send invitation');
    }
  };

  const updateMemberRole = async (membershipId, role) => {
    setTeamMessage('');
    try {
      await api(API_ENDPOINTS.TEAM.MEMBER_DETAIL(membershipId), {
        method: 'PUT',
        body: JSON.stringify({ role }),
      });
      await loadTeam();
    } catch (err) {
      setTeamMessage(err?.message || 'Failed to update role');
    }
  };

  const removeMember = async (membershipId) => {
    setTeamMessage('');
    try {
      await api(API_ENDPOINTS.TEAM.MEMBER_DETAIL(membershipId), { method: 'DELETE' });
      setTeamMessage('Member removed.');
      await loadTeam();
    } catch (err) {
      setTeamMessage(err?.message || 'Failed to remove member');
    }
  };

  const revokeInvitation = async (invitationId) => {
    setTeamMessage('');
    try {
      await api(API_ENDPOINTS.TEAM.INVITATION_DETAIL(invitationId), { method: 'DELETE' });
      setTeamMessage('Invitation revoked.');
      await loadTeam();
    } catch (err) {
      setTeamMessage(err?.message || 'Failed to revoke invitation');
    }
  };

  const canManageTeam = ['owner', 'admin'].includes(teamState.current_role);
  const isTeamOwner = teamState.current_role === 'owner';
  const initialsFor = (member) => {
    const source = member.user?.full_name || member.user?.username || member.user?.email || '?';
    return source
      .split(/\s|@/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  };

  const renderCategoryContent = () => {
    switch (selectedCategory) {
      case 'basic-info':
        return (
          <div className={styles.categoryContent}>
            <h2>Basic Information</h2>
            <p className={styles.categoryDescription}>Update your account information and personal details.</p>

            {statusMessage && <p className={styles.categoryDescription}>{statusMessage}</p>}

            <form className={styles.settingsForm} onSubmit={saveProfile}>
              <div className={styles.formRow}>
                <label className={styles.formField}>
                  <span>Full Name</span>
                  <input type="text" value={profileForm.full_name} onChange={updateProfileField('full_name')} />
                </label>
                <label className={styles.formField}>
                  <span>Username</span>
                  <input type="text" value={profileForm.username} onChange={updateProfileField('username')} />
                </label>
              </div>

              <label className={styles.formField}>
                <span>Email Address</span>
                <input type="email" value={profileForm.email} onChange={updateProfileField('email')} />
              </label>

              <label className={styles.formField}>
                <span>Phone Number</span>
                <input type="tel" value={profileForm.phone_number} onChange={updateProfileField('phone_number')} />
              </label>

              <label className={styles.formField}>
                <span>Bio</span>
                <textarea rows="4" value={profileForm.bio} onChange={updateProfileField('bio')}></textarea>
              </label>

              <div className={styles.formFooter}>
                <button className={styles.saveButton}>Save Changes</button>
                <button type="button" className={styles.cancelButton} onClick={() => user && setProfileForm({
                  full_name: user.full_name || '',
                  username: user.username || '',
                  email: user.email || '',
                  phone_number: user.phone_number || '',
                  bio: user.bio || '',
                })}>Cancel</button>
              </div>
            </form>
          </div>
        );

      case 'sessions':
        return (
          <div className={styles.categoryContent}>
            <SessionManagement />
          </div>
        );

      case 'plans-billing':
        return (
          <div className={styles.categoryContent}>
            <h2>Plans & Billing</h2>
            <p className={styles.categoryDescription}>Manage your subscription plan and billing details.</p>

            <div className={styles.planSection}>
              <h3>Current Plan</h3>
              <div className={styles.planList}>
                {plans.map((p) => (
                  <label key={p.id} className={`${styles.planCard} ${selectedPlan === p.id ? styles.planActive : ''}`}>
                    <input
                      type="radio"
                      name="plan"
                      checked={selectedPlan === p.id}
                      onChange={() => setSelectedPlan(p.id)}
                    />
                    <div className={styles.planBody}>
                      <div className={styles.planHeader}>
                        <div className={styles.planName}>{p.name}</div>
                        <div className={styles.planPrice}>{p.price}</div>
                      </div>
                      <div className={styles.planSubtitle}>{p.subtitle}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.billingSection}>
              <h3>Card Details</h3>
              <form className={styles.settingsForm} onSubmit={(e) => e.preventDefault()}>
                <label className={styles.formField}>
                  <span>Name on Card</span>
                  <input type="text" placeholder="John Doe" />
                </label>

                <label className={styles.formField}>
                  <span>Card Number</span>
                  <input type="text" placeholder="1234 5678 9876 5432" />
                </label>

                <div className={styles.formRow}>
                  <label className={styles.formField}>
                    <span>Expiry Date</span>
                    <input type="text" placeholder="MM/YY" />
                  </label>
                  <label className={styles.formField}>
                    <span>CVV</span>
                    <input type="text" placeholder="123" />
                  </label>
                </div>

                <label className={styles.formField}>
                  <span>Billing Address</span>
                  <input type="text" placeholder="123 Main Street, City, State, ZIP" />
                </label>

                <div className={styles.formFooter}>
                  <button className={styles.saveButton}>Update Card</button>
                </div>
              </form>
            </div>
          </div>
        );

      case 'team':
        return (
          <div className={styles.categoryContent}>
            <h2>Team Management</h2>
            <p className={styles.categoryDescription}>Manage your team members and their permissions.</p>

            <div className={styles.teamSection}>
              {teamMessage && <p className={styles.categoryDescription}>{teamMessage}</p>}

              <form className={styles.settingsForm} onSubmit={saveTeamName}>
                <label className={styles.formField}>
                  <span>Team Name</span>
                  <input
                    type="text"
                    value={teamForm.name}
                    onChange={(event) => setTeamForm((prev) => ({ ...prev, name: event.target.value }))}
                    disabled={!canManageTeam || teamLoading}
                  />
                </label>
                {canManageTeam && (
                  <div className={styles.formFooter}>
                    <button className={styles.saveButton}>Save Team</button>
                  </div>
                )}
              </form>

              <div className={styles.sectionHeader}>
                <h3>Team Members</h3>
                <span className={styles.memberRole}>{teamState.members.length} member(s)</span>
              </div>

              <div className={styles.teamList}>
                {teamState.members.map((member) => (
                  <div className={styles.teamMember} key={member.id}>
                    <div className={styles.memberAvatar}>{initialsFor(member)}</div>
                    <div className={styles.memberInfo}>
                      <div className={styles.memberName}>{member.user?.full_name || member.user?.username || member.user?.email}</div>
                      <div className={styles.memberEmail}>{member.user?.email}</div>
                    </div>
                    {isTeamOwner && member.role !== 'owner' ? (
                      <select
                        className={styles.filterSelect}
                        value={member.role}
                        onChange={(event) => updateMemberRole(member.id, event.target.value)}
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                      </select>
                    ) : (
                      <div className={styles.memberRole}>{member.role}</div>
                    )}
                    {isTeamOwner && member.role !== 'owner' && (
                      <button className={styles.memberAction} onClick={() => removeMember(member.id)}>
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {canManageTeam && (
                <>
                  <h3>Invite Member</h3>
                  <form className={styles.settingsForm} onSubmit={inviteMember}>
                    <div className={styles.formRow}>
                      <label className={styles.formField}>
                        <span>Email Address</span>
                        <input
                          type="email"
                          value={teamForm.inviteEmail}
                          onChange={(event) => setTeamForm((prev) => ({ ...prev, inviteEmail: event.target.value }))}
                          required
                        />
                      </label>
                      <label className={styles.formField}>
                        <span>Role</span>
                        <select
                          className={styles.filterSelect}
                          value={teamForm.inviteRole}
                          onChange={(event) => setTeamForm((prev) => ({ ...prev, inviteRole: event.target.value }))}
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      </label>
                    </div>
                    <div className={styles.formFooter}>
                      <button className={styles.saveButton}>Send Invite</button>
                    </div>
                  </form>

                  <h3>Pending Invitations</h3>
                  <div className={styles.teamList}>
                    {teamState.invitations.length === 0 && (
                      <p className={styles.categoryDescription}>No pending invitations.</p>
                    )}
                    {teamState.invitations.map((invitation) => (
                      <div className={styles.teamMember} key={invitation.id}>
                        <div className={styles.memberAvatar}>@</div>
                        <div className={styles.memberInfo}>
                          <div className={styles.memberName}>{invitation.email}</div>
                          <div className={styles.memberEmail}>Invited as {invitation.role}</div>
                        </div>
                        <div className={styles.memberRole}>{invitation.status}</div>
                        <button className={styles.memberAction} onClick={() => revokeInvitation(invitation.id)}>
                          Revoke
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className={styles.categoryContent}>
            <h2>Appearance</h2>
            <p className={styles.categoryDescription}>Customize the look and feel of your interface.</p>

            <div className={styles.appearanceSection}>
              <h3>Theme</h3>
              <div className={styles.themeOptions}>
                <label className={styles.themeOption}>
                  <input type="radio" name="theme" defaultChecked />
                  <div className={styles.themeCard}>
                    <div className={styles.themePreview} style={{ background: '#ffffff' }}></div>
                    <span>Light</span>
                  </div>
                </label>
                <label className={styles.themeOption}>
                  <input type="radio" name="theme" />
                  <div className={styles.themeCard}>
                    <div className={styles.themePreview} style={{ background: '#1a1a1a' }}></div>
                    <span>Dark</span>
                  </div>
                </label>
                <label className={styles.themeOption}>
                  <input type="radio" name="theme" />
                  <div className={styles.themeCard}>
                    <div className={styles.themePreview} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}></div>
                    <span>Auto</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className={styles.categoryContent}>
            <h2>Notification Preferences</h2>
            <p className={styles.categoryDescription}>Configure how and when you receive notifications.</p>

            <div className={styles.notificationSection}>
              <div className={styles.notificationItem}>
                <div className={styles.notificationInfo}>
                  <h4>Email Notifications</h4>
                  <p>Receive notifications via email</p>
                </div>
                <label className={styles.toggle}>
                  <input type="checkbox" checked={notificationPrefs.email} onChange={updateNotificationPref('email')} />
                  <span className={styles.toggleSlider}></span>
                </label>
              </div>

              <div className={styles.notificationItem}>
                <div className={styles.notificationInfo}>
                  <h4>Push Notifications</h4>
                  <p>Receive push notifications in your browser</p>
                </div>
                <label className={styles.toggle}>
                  <input type="checkbox" checked={notificationPrefs.push} onChange={updateNotificationPref('push')} />
                  <span className={styles.toggleSlider}></span>
                </label>
              </div>

              <div className={styles.notificationItem}>
                <div className={styles.notificationInfo}>
                  <h4>Task Assignments</h4>
                  <p>Get notified when tasks are assigned to you</p>
                </div>
                <label className={styles.toggle}>
                  <input type="checkbox" checked={notificationPrefs.task_assignments} onChange={updateNotificationPref('task_assignments')} />
                  <span className={styles.toggleSlider}></span>
                </label>
              </div>

              <div className={styles.notificationItem}>
                <div className={styles.notificationInfo}>
                  <h4>Project Updates</h4>
                  <p>Receive updates about project changes</p>
                </div>
                <label className={styles.toggle}>
                  <input type="checkbox" checked={notificationPrefs.project_updates} onChange={updateNotificationPref('project_updates')} />
                  <span className={styles.toggleSlider}></span>
                </label>
              </div>
            </div>
          </div>
        );

      case 'audit-trail':
        return (
          <div className={styles.categoryContent}>
            <h2>Audit Trail</h2>
            <p className={styles.categoryDescription}>View all activity logs and system events.</p>

            <div className={styles.auditSection}>
              <div className={styles.auditFilters}>
                <select className={styles.filterSelect}>
                  <option>All Activities</option>
                  <option>User Actions</option>
                  <option>System Events</option>
                </select>
                <input type="date" className={styles.filterDate} />
              </div>

              <div className={styles.auditList}>
                <div className={styles.auditItem}>
                  <div className={styles.auditIcon}>✓</div>
                  <div className={styles.auditDetails}>
                    <div className={styles.auditAction}>Profile updated</div>
                    <div className={styles.auditTime}>2 hours ago</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'integrations':
        return (
          <div className={styles.categoryContent}>
            <h2>Integrations</h2>
            <p className={styles.categoryDescription}>Connect your favorite tools and services.</p>

            <div className={styles.integrationsSection}>
              <div className={styles.integrationCard}>
                <div className={styles.integrationIcon}>📧</div>
                <div className={styles.integrationInfo}>
                  <h4>Email</h4>
                  <p>Connect your email account</p>
                </div>
                <button className={styles.connectButton}>Connect</button>
              </div>

              <div className={styles.integrationCard}>
                <div className={styles.integrationIcon}>📅</div>
                <div className={styles.integrationInfo}>
                  <h4>Google Calendar</h4>
                  <p>Sync with Google Calendar</p>
                </div>
                <button className={styles.connectButton}>Connect</button>
              </div>

              <div className={styles.integrationCard}>
                <div className={styles.integrationIcon}>💬</div>
                <div className={styles.integrationInfo}>
                  <h4>Slack</h4>
                  <p>Get notifications in Slack</p>
                </div>
                <button className={styles.connectButton}>Connect</button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className={styles.categoryContent}>
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>⚙️</div>
              <h2>Select a category</h2>
              <p>Choose a setting category from the sidebar to get started.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={styles.settingsPage}>
      <div className={styles.header}>
        <h1>Settings</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.settingsNav}>
          {settingsCategories.map((category) => (
            <button
              key={category.id}
              className={`${styles.navItem} ${selectedCategory === category.id ? styles.active : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span className={styles.navIcon}>{category.icon}</span>
              <div className={styles.navContent}>
                <div className={styles.navName}>{category.name}</div>
                <div className={styles.navDescription}>{category.description}</div>
              </div>
            </button>
          ))}
        </div>

        <div className={styles.settingsDetail}>
          {renderCategoryContent()}
        </div>
      </div>
    </div>
  );
}
