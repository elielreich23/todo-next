"use client";

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { API_ENDPOINTS } from '../../constants';
import styles from './SessionManagement.module.scss';

const SessionManagement = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revoking, setRevoking] = useState(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api(API_ENDPOINTS.AUTH.SESSIONS_LIST);
      if (response.success) {
        setSessions(response.sessions || []);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setError('Failed to load sessions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    if (!confirm('Are you sure you want to revoke this session? The user will be logged out from this device.')) {
      return;
    }

    try {
      setRevoking(sessionId);
      const response = await api(API_ENDPOINTS.AUTH.SESSIONS_REVOKE, {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (response.success) {
        // Remove revoked session from list
        setSessions(sessions.filter(s => s.id !== sessionId));
      } else {
        alert('Failed to revoke session. Please try again.');
      }
    } catch (err) {
      console.error('Failed to revoke session:', err);
      alert('Failed to revoke session. Please try again.');
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!confirm('Are you sure you want to revoke all other sessions? You will remain logged in on this device, but all other devices will be logged out.')) {
      return;
    }

    try {
      setRevoking('all');
      const response = await api(API_ENDPOINTS.AUTH.SESSIONS_REVOKE_ALL, {
        method: 'POST',
        body: JSON.stringify({ exclude_current: true }),
      });

      if (response.success) {
        // Reload sessions to show updated list
        await loadSessions();
        alert(`${response.revoked_count || 0} session(s) revoked successfully.`);
      } else {
        alert('Failed to revoke sessions. Please try again.');
      }
    } catch (err) {
      console.error('Failed to revoke sessions:', err);
      alert('Failed to revoke sessions. Please try again.');
    } finally {
      setRevoking(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading sessions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
        <button onClick={loadSessions} className={styles.retryButton}>Retry</button>
      </div>
    );
  }

  const currentSession = sessions.find(s => s.is_current);
  const otherSessions = sessions.filter(s => !s.is_current);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Active Sessions</h2>
        <p className={styles.description}>
          Manage your active sessions across different devices. You can revoke any session to log out from that device.
        </p>
      </div>

      {currentSession && (
        <div className={styles.currentSession}>
          <h3>Current Session</h3>
          <div className={styles.sessionCard}>
            <div className={styles.sessionInfo}>
              <div className={styles.deviceInfo}>
                <span className={styles.deviceName}>{currentSession.device_name}</span>
                <span className={styles.badge}>Current</span>
              </div>
              <div className={styles.details}>
                <div className={styles.detailItem}>
                  <span className={styles.label}>Browser:</span>
                  <span className={styles.value}>{currentSession.browser}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.label}>OS:</span>
                  <span className={styles.value}>{currentSession.os}</span>
                </div>
                {currentSession.location && (
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Location:</span>
                    <span className={styles.value}>{currentSession.location}</span>
                  </div>
                )}
                {currentSession.ip_address && (
                  <div className={styles.detailItem}>
                    <span className={styles.label}>IP Address:</span>
                    <span className={styles.value}>{currentSession.ip_address}</span>
                  </div>
                )}
                <div className={styles.detailItem}>
                  <span className={styles.label}>Last Activity:</span>
                  <span className={styles.value}>{formatDate(currentSession.last_activity)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {otherSessions.length > 0 && (
        <div className={styles.otherSessions}>
          <div className={styles.otherSessionsHeader}>
            <h3>Other Sessions ({otherSessions.length})</h3>
            <button
              onClick={handleRevokeAllSessions}
              disabled={revoking === 'all'}
              className={styles.revokeAllButton}
            >
              {revoking === 'all' ? 'Revoking...' : 'Revoke All Other Sessions'}
            </button>
          </div>
          <div className={styles.sessionsList}>
            {otherSessions.map((session) => (
              <div key={session.id} className={styles.sessionCard}>
                <div className={styles.sessionInfo}>
                  <div className={styles.deviceInfo}>
                    <span className={styles.deviceName}>{session.device_name}</span>
                    {session.is_active ? (
                      <span className={styles.activeBadge}>Active</span>
                    ) : (
                      <span className={styles.inactiveBadge}>Inactive</span>
                    )}
                  </div>
                  <div className={styles.details}>
                    <div className={styles.detailItem}>
                      <span className={styles.label}>Browser:</span>
                      <span className={styles.value}>{session.browser}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.label}>OS:</span>
                      <span className={styles.value}>{session.os}</span>
                    </div>
                    {session.location && (
                      <div className={styles.detailItem}>
                        <span className={styles.label}>Location:</span>
                        <span className={styles.value}>{session.location}</span>
                      </div>
                    )}
                    {session.ip_address && (
                      <div className={styles.detailItem}>
                        <span className={styles.label}>IP Address:</span>
                        <span className={styles.value}>{session.ip_address}</span>
                      </div>
                    )}
                    <div className={styles.detailItem}>
                      <span className={styles.label}>Last Activity:</span>
                      <span className={styles.value}>{formatDate(session.last_activity)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRevokeSession(session.id)}
                  disabled={revoking === session.id}
                  className={styles.revokeButton}
                >
                  {revoking === session.id ? 'Revoking...' : 'Revoke'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {sessions.length === 0 && (
        <div className={styles.emptyState}>
          <p>No active sessions found.</p>
        </div>
      )}
    </div>
  );
};

export default SessionManagement;
