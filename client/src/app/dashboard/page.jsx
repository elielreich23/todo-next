"use client";

import { useUser } from '../../contexts/UserContext';
import { ProtectedRoute } from '../../components/ProtectedRoute';

export default function WelcomePage() {
  const { user, isLoading, logout } = useUser();

  // Add debugging
  console.log('Dashboard render - user:', user, 'isLoading:', isLoading);

  const handleLogout = () => {
    console.log('Logout clicked');
    
    // Show confirmation dialog
    const confirmed = window.confirm('Are you sure you want to logout?');
    
    if (confirmed) {
      // Use the context logout method
      logout();
      // Redirect to signup page
      window.location.href = '/auth/signup';
    }
  };

  return (
    <ProtectedRoute>
      <div style={{ 
        textAlign: 'center', 
        marginTop: '50px', 
        fontSize: '2rem',
        padding: '20px',
        fontFamily: 'Arial, sans-serif'
      }}>
        {isLoading ? (
          <div>Loading user data...</div>
        ) : user ? (
          <>
            <h1 style={{ color: '#333', marginBottom: '20px' }}>
              Hello {user.username}! Welcome to your dashboard.
            </h1>
            
            <div style={{ 
              fontSize: '1.2rem', 
              color: '#666', 
              marginTop: '20px',
              padding: '20px',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              display: 'inline-block',
              textAlign: 'left'
            }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>User Information:</h3>
              <p><strong>Username:</strong> {user.username}</p>
              <p><strong>Full Name:</strong> {user.fullName}</p>
              <p><strong>Email:</strong> {user.email}</p>
              {user.id && <p><strong>User ID:</strong> {user.id}</p>}
            </div>
            
            <div style={{ 
              marginTop: '40px',
              fontSize: '1rem',
              color: '#888'
            }}>
              <p>Your dashboard is ready! 🎉</p>
              <p>Start managing your tasks and projects.</p>
              <p style={{ marginTop: '20px', fontSize: '0.9rem' }}>
                💡 <strong>Tip:</strong> Your session is now persistent. Try refreshing the page!
              </p>
            </div>
            
            <button 
              onClick={handleLogout}
              style={{
                marginTop: '30px',
                padding: '12px 24px',
                backgroundColor: '#ff4757',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#ff3742';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#ff4757';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }}
            >
              🚪 Logout
            </button>
          </>
        ) : (
          <div>No user data available</div>
        )}
      </div>
    </ProtectedRoute>
  );
}
