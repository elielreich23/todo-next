"use client";

import React, { useState } from 'react';
import styles from './settings.module.scss';

const settingsCategories = [
  { id: 'basic-info', name: 'Basic Info', icon: '👤', description: 'Manage your account information' },
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

  const renderCategoryContent = () => {
    switch (selectedCategory) {
      case 'basic-info':
        return (
          <div className={styles.categoryContent}>
            <h2>Basic Information</h2>
            <p className={styles.categoryDescription}>Update your account information and personal details.</p>

            <form className={styles.settingsForm} onSubmit={(e) => e.preventDefault()}>
              <div className={styles.formRow}>
                <label className={styles.formField}>
                  <span>Full Name</span>
                  <input type="text" placeholder="John Doe" />
                </label>
                <label className={styles.formField}>
                  <span>Username</span>
                  <input type="text" placeholder="johndoe" />
                </label>
              </div>

              <label className={styles.formField}>
                <span>Email Address</span>
                <input type="email" placeholder="john.doe@example.com" />
              </label>

              <label className={styles.formField}>
                <span>Phone Number</span>
                <input type="tel" placeholder="+1 (555) 123-4567" />
              </label>

              <label className={styles.formField}>
                <span>Bio</span>
                <textarea rows="4" placeholder="Tell us about yourself..."></textarea>
              </label>

              <div className={styles.formFooter}>
                <button className={styles.saveButton}>Save Changes</button>
                <button className={styles.cancelButton}>Cancel</button>
              </div>
            </form>
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
              <div className={styles.sectionHeader}>
                <h3>Team Members</h3>
                <button className={styles.addButton}>+ Add Member</button>
              </div>

              <div className={styles.teamList}>
                <div className={styles.teamMember}>
                  <div className={styles.memberAvatar}>JD</div>
                  <div className={styles.memberInfo}>
                    <div className={styles.memberName}>John Doe</div>
                    <div className={styles.memberEmail}>john.doe@example.com</div>
                  </div>
                  <div className={styles.memberRole}>Admin</div>
                  <button className={styles.memberAction}>Edit</button>
                </div>
              </div>
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
                  <input type="checkbox" defaultChecked />
                  <span className={styles.toggleSlider}></span>
                </label>
              </div>

              <div className={styles.notificationItem}>
                <div className={styles.notificationInfo}>
                  <h4>Push Notifications</h4>
                  <p>Receive push notifications in your browser</p>
                </div>
                <label className={styles.toggle}>
                  <input type="checkbox" defaultChecked />
                  <span className={styles.toggleSlider}></span>
                </label>
              </div>

              <div className={styles.notificationItem}>
                <div className={styles.notificationInfo}>
                  <h4>Task Assignments</h4>
                  <p>Get notified when tasks are assigned to you</p>
                </div>
                <label className={styles.toggle}>
                  <input type="checkbox" defaultChecked />
                  <span className={styles.toggleSlider}></span>
                </label>
              </div>

              <div className={styles.notificationItem}>
                <div className={styles.notificationInfo}>
                  <h4>Project Updates</h4>
                  <p>Receive updates about project changes</p>
                </div>
                <label className={styles.toggle}>
                  <input type="checkbox" />
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
