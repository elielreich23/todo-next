# Session Management Implementation

This document explains the comprehensive session management system implemented for the todo application, ensuring each user can only access their own tasks and projects.

## Overview

The session management system provides:
- **User Isolation**: Each user only sees their own tasks and projects
- **Session Persistence**: User sessions persist across browser refreshes
- **Automatic Logout**: Sessions are cleared when users log out or tokens expire
- **Security**: Proper token validation and refresh handling

## Architecture

### Backend (Django)
The backend already has proper user authentication and data isolation:

- **Models**: `Project` and `Task` models have `owner` foreign keys linking to the authenticated user
- **Views**: All API endpoints filter data by `owner=request.user`
- **Authentication**: JWT token-based authentication with refresh tokens

### Frontend (Next.js)

#### 1. UserContext (`/src/contexts/UserContext.tsx`)
- Manages user authentication state
- Handles login/logout operations
- Provides session validation
- Dispatches logout events to other contexts

#### 2. ProjectsContext (`/src/contexts/ProjectsContext.tsx`)
- Manages projects and tasks data
- Listens for logout events to clear data
- Ensures data isolation per user

#### 3. API Client (`/src/lib/api.ts`)
- Handles authentication headers
- Automatically refreshes expired tokens
- Triggers logout on authentication failures

#### 4. Session Hook (`/src/hooks/useSession.ts`)
- Provides session state management
- Validates sessions
- Handles session clearing

#### 5. Session Manager (`/src/utils/sessionManager.ts`)
- Utility class for session storage operations
- Handles token management
- Provides session validation

## Key Features

### 1. User Data Isolation
```typescript
// Backend automatically filters by owner
projects = Project.objects.filter(owner=request.user)
tasks = Task.objects.filter(owner=request.user)
```

### 2. Session Persistence
```typescript
// Tokens are stored in localStorage
localStorage.setItem('access_token', tokens.access);
localStorage.setItem('refresh_token', tokens.refresh);
```

### 3. Automatic Logout
```typescript
// When logout is called, all data is cleared
const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_data');
  sessionStorage.clear();
  setUser(null);
  window.dispatchEvent(new CustomEvent('userLogout'));
};
```

### 4. Cross-Context Communication
```typescript
// ProjectsContext listens for logout events
useEffect(() => {
  const handleLogout = () => {
    setProjects([]);
    setTasks([]);
    setSelectedProjectId(null);
  };
  window.addEventListener('userLogout', handleLogout);
  return () => window.removeEventListener('userLogout', handleLogout);
}, []);
```

### 5. Token Refresh Handling
```typescript
// API client automatically handles token refresh
if (res.status === 401) {
  const newToken = await refreshToken();
  if (!newToken) {
    window.dispatchEvent(new CustomEvent('userLogout'));
    window.location.href = '/auth/signin';
  }
  // Retry request with new token
}
```

## Usage Examples

### Login
```typescript
const { remoteLogin } = useUser();
await remoteLogin({ email: 'user@example.com', password: 'password' });
```

### Logout
```typescript
const { logout } = useUser();
logout(); // Clears all user data and redirects to login
```

### Session Validation
```typescript
const { validateSession } = useUser();
const isValid = await validateSession();
```

### Using Session Hook
```typescript
const { user, isAuthenticated, isSessionValid, clearSession } = useSession();
```

## Security Considerations

1. **Token Storage**: Tokens are stored in localStorage (consider httpOnly cookies for production)
2. **Token Refresh**: Automatic refresh prevents session interruption
3. **Data Clearing**: All user data is cleared on logout
4. **Session Validation**: Regular validation ensures session integrity
5. **Error Handling**: Proper error handling prevents data leaks

## Session Flow

1. **Login**: User provides credentials → Backend validates → Returns JWT tokens → Frontend stores tokens
2. **API Requests**: Frontend includes Bearer token → Backend validates → Returns user-specific data
3. **Token Expiry**: API returns 401 → Frontend attempts refresh → If refresh fails → Logout
4. **Logout**: User clicks logout → All data cleared → Redirect to login page

## Benefits

- **User Privacy**: Each user only sees their own data
- **Session Security**: Proper token management and validation
- **User Experience**: Seamless session persistence across browser refreshes
- **Data Integrity**: Automatic cleanup prevents data leakage between users
- **Scalability**: System can handle multiple concurrent users

## Testing Session Management

To test the session management:

1. **Login as User A**: Create some tasks and projects
2. **Logout**: Verify all data is cleared
3. **Login as User B**: Verify User A's data is not visible
4. **Refresh Page**: Verify session persists
5. **Token Expiry**: Wait for token to expire and verify automatic refresh

This implementation ensures complete user data isolation and proper session management for the todo application.
