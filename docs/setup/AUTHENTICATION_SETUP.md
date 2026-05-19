# Authentication Setup Guide

Complete guide for setting up Google OAuth and Password Reset functionality in Taskero.

## Table of Contents

1. [Google OAuth Setup](#google-oauth-setup)
2. [Password Reset Configuration](#password-reset-configuration)
3. [Quick Start](#quick-start)
4. [Troubleshooting](#troubleshooting)

---

## Google OAuth Setup

### Step 1: Google Cloud Console Configuration

1. **Create OAuth 2.0 Credentials**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - Select **Web application**
   - Add authorized origins:
     - `http://localhost:3000` (development)
     - `https://your-production-domain.com` (production)

2. **Copy Your Client ID**: Save the Client ID (ends with `.apps.googleusercontent.com`)

### Step 2: Backend Configuration

Add to your backend `.env` file or environment variables:

```bash
GOOGLE_OAUTH_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### Step 3: Frontend Configuration

Create/update `.env.local`:

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

**Important**: Restart your Next.js dev server after adding this variable.

---

## Password Reset Configuration

### Development (Console Email)

By default, password reset emails are printed to the console. No additional setup needed.

### Production (SMTP Email)

#### Gmail Setup (Recommended for Testing)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Click **2-Step Verification** → **App passwords**
   - Generate a new app password for "Mail"
   - Copy the 16-character password

3. Add to backend `.env`:

```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-16-char-app-password
DEFAULT_FROM_EMAIL=noreply@taskero.com
FRONTEND_URL=https://your-production-domain.com
```

#### Other Email Providers

Update the SMTP settings accordingly:
- **SendGrid**: `smtp.sendgrid.net`, port 587
- **Mailgun**: `smtp.mailgun.org`, port 587
- **Outlook**: `smtp-mail.outlook.com`, port 587

---

## Quick Start

### 1. Install Backend Dependencies

```bash
cd backend
pip install -r requirements-local.txt
```

This installs:
- Django and DRF
- `google-auth` for OAuth token verification
- `zxcvbn` for password strength validation

### 2. Configure Environment Variables

**Backend** (`backend/.env` or environment):
```bash
GOOGLE_OAUTH_CLIENT_ID=your-client-id.apps.googleusercontent.com
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
FRONTEND_URL=http://localhost:3000
```

**Frontend** (`.env.local`):
```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### 3. Start Servers

**Backend**:
```bash
cd backend
python manage.py runserver
```

**Frontend**:
```bash
cd client
npm run dev
```

### 4. Test the Features

- **Google Sign-In**: Click "Continue with Google" on signup/signin pages
- **Password Reset**:
  1. Go to "Forgot Password"
  2. Enter your email
  3. Check console (dev) or email (production)
  4. Click reset link
  5. Set new password with strength requirements

---

## Features Implemented

### ✅ Google OAuth Authentication

- **Backend**: Token verification and user creation/login
- **Frontend**: Google Identity Services integration
- **Flow**: Sign in or sign up with Google account
- **User Data**: Automatically collects name, email, profile picture

### ✅ Password Reset Flow

- **Request Reset**: Email with reset link
- **Reset Password**: Secure token-based reset
- **Password Strength**: Integrated validation
- **Email Configuration**: Console (dev) or SMTP (production)

### ✅ Password Strength Validation

- Real-time strength meter
- zxcvbn algorithm
- Visual feedback
- Minimum requirements enforcement

---

## API Endpoints

### Google Authentication

```
POST /api/auth/google/
Body: { "token": "google-id-token" }
Response: { "success": true, "user": {...}, "tokens": {...} }
```

### Password Reset

```
POST /api/auth/password/reset/request/
Body: { "email": "user@example.com" }
Response: { "success": true, "message": "..." }

POST /api/auth/password/reset/
Body: { "token": "...", "uid": "...", "password": "...", "password_confirm": "..." }
Response: { "success": true, "message": "Password has been reset successfully" }
```

---

## Troubleshooting

### Google Sign-In Not Working

1. **Check Client ID**: Verify it's set in both frontend and backend
2. **Authorized Origins**: Ensure your domain is in Google Console
3. **Console Errors**: Check browser console for errors
4. **Network Tab**: Verify API calls are being made

### Password Reset Emails Not Sending

1. **Development**: Check console - emails print there
2. **SMTP Settings**: Verify email configuration
3. **Gmail App Password**: Use app password, not regular password
4. **Check Logs**: Look for email errors in Django logs

### Backend Import Errors

```bash
# Install missing packages
cd backend
pip install google-auth zxcvbn
```

---

## Security Notes

- ✅ OAuth tokens are verified server-side
- ✅ Password reset tokens expire after 24 hours
- ✅ Strong password requirements enforced
- ✅ Email verification required for OAuth
- ⚠️ **Never commit** Client IDs or secrets to git
- ⚠️ Use environment variables for all sensitive data

---

## Next Steps

1. Set up Google OAuth Client ID
2. Configure email settings (if using production)
3. Test authentication flows
4. Deploy with proper environment variables

For detailed setup instructions, see:
- [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) - Detailed Google OAuth guide
- [AUTH_IMPLEMENTATION_SUMMARY.md](./AUTH_IMPLEMENTATION_SUMMARY.md) - Implementation overview
