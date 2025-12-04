# Vercel Frontend + Railway Backend Setup Guide

This guide will help you connect your Next.js frontend deployed on Vercel with your Django backend deployed on Railway.

## Prerequisites

- ✅ Backend deployed on Railway (with a public URL)
- ✅ Frontend code ready to deploy on Vercel
- ✅ Railway backend URL (e.g., `https://your-app.up.railway.app`)

## Step 1: Get Your Railway Backend URL

1. Go to your Railway project dashboard
2. Click on your backend service
3. Go to the **Settings** tab
4. Find your **Public Domain** (e.g., `your-app.up.railway.app`)
5. Copy the full URL: `https://your-app.up.railway.app`

**Note:** If you have a custom domain, use that instead.

## Step 2: Configure Backend CORS (Railway)

Your backend needs to allow requests from your Vercel frontend.

### Option A: Using Railway Environment Variables

1. Go to your Railway service → **Variables** tab
2. Add or update the following environment variable:

   ```
   CORS_ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://your-vercel-app-git-main.vercel.app,http://localhost:3000
   ```

   **Important:** Replace `your-vercel-app` with your actual Vercel app name.

3. If you want to support all Vercel preview deployments, you can also add:
   ```
   CORS_ALLOWED_ORIGIN_REGEXES=^https://.*\.vercel\.app$
   ```

### Option B: Update settings_production.py (Alternative)

If you prefer to hardcode it (not recommended for multiple environments), edit `backend/taskero_backend/settings_production.py`:

```python
CORS_ALLOWED_ORIGINS = [
    "https://your-vercel-app.vercel.app",
    "https://your-vercel-app-git-main.vercel.app",
    "http://localhost:3000",
]
```

### Verify Backend Configuration

Make sure your Railway backend has these environment variables set:

```
DJANGO_SETTINGS_MODULE=taskero_backend.settings_production
ALLOWED_HOSTS=your-app.up.railway.app,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:3000
```

## Step 3: Configure Frontend (Vercel)

### Option A: Using Vercel Dashboard (Recommended)

1. Go to your Vercel project dashboard
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Add a new environment variable:

   - **Name:** `NEXT_PUBLIC_API_BASE_URL`
   - **Value:** `https://your-app.up.railway.app` (your Railway backend URL)
   - **Environment:** Select all (Production, Preview, Development)

5. Click **Save**

### Option B: Using Vercel CLI

```bash
vercel env add NEXT_PUBLIC_API_BASE_URL
# Enter: https://your-app.up.railway.app
# Select: Production, Preview, Development
```

### Verify Frontend Configuration

Your frontend code should already be configured to use this environment variable. Check `client/src/constants/index.ts`:

```typescript
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
```

This means:
- In production/preview: Uses your Railway backend URL
- In local development: Falls back to `http://localhost:8000`

## Step 4: Deploy and Test

### Deploy Frontend to Vercel

1. Push your changes to GitHub (if using Git integration)
2. Vercel will automatically deploy
3. Or manually trigger a deployment from Vercel dashboard

### Test the Connection

1. **Test Backend Health:**
   ```bash
   curl https://your-app.up.railway.app/api/
   ```

2. **Test from Frontend:**
   - Open your Vercel-deployed app
   - Open browser DevTools → **Network** tab
   - Try to sign in or make an API call
   - Check that requests are going to your Railway backend URL
   - Verify there are no CORS errors in the console

3. **Check for CORS Errors:**
   - If you see CORS errors, verify:
     - `CORS_ALLOWED_ORIGINS` in Railway includes your exact Vercel URL
     - URL includes `https://` protocol
     - No trailing slashes
     - Restart Railway service after updating environment variables

## Step 5: Environment Variables Summary

### Railway (Backend)

```
DJANGO_SETTINGS_MODULE=taskero_backend.settings_production
SECRET_KEY=your-super-secret-key-here
DEBUG=False
DATABASE_URL=<automatically set by Railway>
ALLOWED_HOSTS=your-app.up.railway.app,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:3000
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

### Vercel (Frontend)

```
NEXT_PUBLIC_API_BASE_URL=https://your-app.up.railway.app
```

## Troubleshooting

### CORS Errors

**Error:** `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Solution:**
1. Verify `CORS_ALLOWED_ORIGINS` in Railway includes your exact Vercel URL
2. Make sure the URL includes `https://` protocol
3. Check for trailing slashes (should not have one)
4. Restart Railway service after updating environment variables
5. Check Railway logs for CORS-related errors

**Quick Test:**
```bash
# Test CORS from command line
curl -H "Origin: https://your-vercel-app.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: authorization" \
     -X OPTIONS \
     https://your-app.up.railway.app/api/
```

### 401 Unauthorized Errors

**Error:** `401 Unauthorized` when making API requests

**Solution:**
1. Check that API requests include `Authorization` headers
2. Verify JWT tokens are being sent correctly
3. Check browser console for token storage issues
4. Ensure token refresh is working properly

### 502 Bad Gateway / Connection Errors

**Error:** `502 Bad Gateway` or connection refused

**Solution:**
1. Check Railway service logs for errors
2. Verify `DATABASE_URL` is correctly set in Railway
3. Ensure migrations ran successfully
4. Check that Railway service is running and healthy
5. Verify the Railway URL is correct and accessible

### Environment Variable Not Working

**Issue:** Frontend still using localhost URL

**Solution:**
1. Verify environment variable name is exactly: `NEXT_PUBLIC_API_BASE_URL`
2. Make sure it's set for the correct environment (Production/Preview)
3. Redeploy Vercel after adding/updating environment variables
4. Check that the variable is available in the build logs
5. Clear browser cache and hard refresh

### Preview Deployments Not Working

**Issue:** Vercel preview deployments can't connect to backend

**Solution:**
1. Add preview URL to Railway `CORS_ALLOWED_ORIGINS`:
   ```
   CORS_ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-app-git-*.vercel.app,http://localhost:3000
   ```
2. Or use regex pattern in `settings_production.py`:
   ```python
   CORS_ALLOWED_ORIGIN_REGEXES = [
       r"^https://.*\.vercel\.app$",
   ]
   ```

## Security Best Practices

1. ✅ Always use HTTPS in production
2. ✅ Set `SECURE_SSL_REDIRECT=True` in Railway
3. ✅ Use strong `SECRET_KEY` (never commit to Git)
4. ✅ Set `DEBUG=False` in production
5. ✅ Configure `ALLOWED_HOSTS` properly
6. ✅ Use specific CORS origins (avoid wildcards in production)
7. ✅ Enable secure cookies (`SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`)

## Quick Reference

### Railway Backend URL Format
```
https://<service-name>.up.railway.app
```

### Vercel Frontend URL Format
```
https://<app-name>.vercel.app
https://<app-name>-git-<branch>.vercel.app (preview)
```

### Testing Commands

```bash
# Test backend health
curl https://your-app.up.railway.app/api/

# Test CORS
curl -H "Origin: https://your-vercel-app.vercel.app" \
     -v https://your-app.up.railway.app/api/

# Test from frontend (in browser console)
fetch('https://your-app.up.railway.app/api/')
  .then(r => r.json())
  .then(console.log)
```

## Support

For issues specific to:
- **Railway**: Check Railway documentation at https://docs.railway.app
- **Vercel**: Check Vercel documentation at https://vercel.com/docs
- **Django CORS**: Check django-cors-headers at https://github.com/adamchainz/django-cors-headers
