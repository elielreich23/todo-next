# Google OAuth Authentication Setup Guide

This guide will help you set up Google OAuth authentication for the Taskero application.

## Overview

Google OAuth allows users to sign in or sign up using their Google account, eliminating the need to create a separate password for your application.

## Prerequisites

- Google Cloud Console account
- Access to your project's environment variables

## Backend Setup

### 1. Install Dependencies

The backend already includes `google-auth==2.23.4` in `requirements.txt`. Install it:

```bash
cd backend
pip install -r requirements-local.txt
```

### 2. Configure Google OAuth Client ID

Add your Google OAuth Client ID to your environment variables:

```bash
# In your .env file or environment
GOOGLE_OAUTH_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

Or set it in Django settings (not recommended for production):

```python
GOOGLE_OAUTH_CLIENT_ID = "your-google-client-id.apps.googleusercontent.com"
```

## Frontend Setup

### 1. Configure Google Client ID

Add your Google OAuth Client ID to your Next.js environment variables:

Create or update `.env.local` in the `client/` directory:

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### 2. Restart Development Server

After adding the environment variable, restart your Next.js development server:

```bash
cd client
npm run dev
```

## Google Cloud Console Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API** (if not already enabled)

### 2. Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Web application** as the application type
4. Configure:
   - **Name**: Taskero Application (or your preferred name)
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for local development)
     - `https://your-production-domain.com` (for production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000` (for local development)
     - `https://your-production-domain.com` (for production)
5. Click **Create**
6. Copy the **Client ID** (you'll need this for environment variables)

### 3. Configure OAuth Consent Screen

1. Navigate to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type (unless you have a Google Workspace)
3. Fill in required information:
   - **App name**: Taskero
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Add scopes (optional for basic profile):
   - `email`
   - `profile`
   - `openid`
5. Save and continue through the setup

## Environment Variables Summary

### Backend (.env or environment variables)

```bash
GOOGLE_OAUTH_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Email configuration (for password reset)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend  # Development
# EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend  # Production
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password  # Use App Password for Gmail
DEFAULT_FROM_EMAIL=noreply@taskero.com
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## Password Reset Email Configuration

### For Development (Console Backend)

The default configuration uses the console email backend, which prints emails to the console. This is fine for development.

### For Production (SMTP)

1. **Gmail Setup** (recommended for testing):
   - Enable 2-Factor Authentication on your Gmail account
   - Generate an App Password: [Google App Passwords](https://myaccount.google.com/apppasswords)
   - Use the app password as `EMAIL_HOST_PASSWORD`

2. **Other Email Providers**:
   - Update `EMAIL_HOST`, `EMAIL_PORT`, and `EMAIL_USE_TLS` accordingly
   - Use your provider's SMTP settings

### Email Configuration Example (Gmail)

```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@gmail.com'
EMAIL_HOST_PASSWORD = 'your-app-password'  # 16-character app password
DEFAULT_FROM_EMAIL = 'noreply@taskero.com'
```

## Testing

### Test Google Sign-In

1. Start your backend server:
   ```bash
   cd backend
   python manage.py runserver
   ```

2. Start your frontend server:
   ```bash
   cd client
   npm run dev
   ```

3. Visit the signup or signin page
4. Click "Continue with Google"
5. Select a Google account
6. You should be authenticated and redirected to the dashboard

### Test Password Reset

1. Go to the forgot password page
2. Enter your email address
3. Check the console (development) or email inbox (production)
4. Click the reset link
5. Enter a new password with strength requirements
6. You should be able to log in with the new password

## Troubleshooting

### Google Sign-In Not Working

1. **Check Client ID**: Verify `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set correctly
2. **Check Authorized Origins**: Ensure your domain is in authorized JavaScript origins
3. **Check Console**: Look for errors in browser console
4. **Check Network**: Verify API calls are being made to `/api/auth/google/`

### Password Reset Emails Not Sending

1. **Development**: Check console output - emails are printed there
2. **Production**:
   - Verify SMTP settings are correct
   - Check spam folder
   - Verify email backend is configured
   - Check Django logs for email errors

### Backend Errors

1. **Import Error**: Ensure `google-auth` is installed: `pip install google-auth`
2. **Token Verification Failed**: Check that Google Client ID matches between frontend and backend
3. **User Creation Failed**: Check database migrations are up to date

## Security Considerations

1. **Never commit** your Google Client ID or Client Secret to version control
2. Use environment variables for all sensitive configuration
3. Use App Passwords for Gmail (not your regular password)
4. Restrict OAuth credentials to specific domains in production
5. Enable HTTPS in production

## Production Checklist

- [ ] Google OAuth Client ID configured
- [ ] Authorized JavaScript origins set to production domain
- [ ] Email backend configured (SMTP)
- [ ] Email credentials set via environment variables
- [ ] `FRONTEND_URL` set to production domain
- [ ] HTTPS enabled
- [ ] Environment variables secured (not in code)

## API Endpoints

### Google Authentication

**Endpoint**: `POST /api/auth/google/`

**Request**:
```json
{
  "token": "google-id-token-from-frontend"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Authentication successful",
  "user": {
    "id": 1,
    "username": "user123",
    "email": "user@example.com",
    "full_name": "User Name"
  },
  "tokens": {
    "access": "jwt-access-token",
    "refresh": "jwt-refresh-token"
  }
}
```

## References

- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
- [Django Email Backends](https://docs.djangoproject.com/en/stable/topics/email/)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
