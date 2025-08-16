"use client";

import React from 'react';
import { useUser } from '../../contexts/UserContext';

export default function DashboardPage() {
  const { user } = useUser();

  return (
    <div style={{
      padding: '2rem',
      textAlign: 'center',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '3rem',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        maxWidth: '600px',
        width: '100%'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          color: '#333',
          marginBottom: '1rem',
          fontWeight: '700'
        }}>
          Welcome back! 👋
        </h1>
        
        <p style={{
          fontSize: '1.2rem',
          color: '#666',
          marginBottom: '2rem',
          lineHeight: '1.6'
        }}>
          Great to see you again, <strong style={{ color: '#fea451' }}>{user?.username || 'User'}</strong>!
        </p>
        
        <div style={{
          background: 'linear-gradient(135deg, #fea451 0%, #ff8c00 100%)',
          color: 'white',
          padding: '1rem 2rem',
          borderRadius: '12px',
          fontSize: '1.1rem',
          fontWeight: '600',
          boxShadow: '0 8px 25px rgba(254, 164, 81, 0.3)'
        }}>
          Your dashboard is ready for action! 🚀
        </div>
        
        <p style={{
          fontSize: '0.9rem',
          color: '#888',
          marginTop: '2rem',
          fontStyle: 'italic'
        }}>
          Session management is active. You can now access all your tasks and projects.
        </p>
      </div>
    </div>
  );
}
