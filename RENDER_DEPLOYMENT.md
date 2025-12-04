# Render Backend Deployment Guide (with Vercel Frontend)

This guide covers deploying the Django backend to Render and configuring it to communicate with a Vercel-deployed frontend.

## Quick Start

### Prerequisites
- GitHub repository with your code
- Render account (https://render.com)
- Vercel account (for frontend deployment)

## Step 1: Deploy Backend to Render

### Option A: Using render.yaml (Recommended)

1. **Push your code to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Configure Render deployment"
   git push origin main
   ```

2. **Connect Repository to Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect `render.yaml` and create services

3. **Update Environment Variables**
   - After services are created, go to your `taskero-backend` service
   - Navigate to **Environment** tab
   - **IMPORTANT**: Update `CORS_ALLOWED_ORIGINS` with your Vercel URL:
     ```
     https://your-app.vercel.app,http://localhost:3000
     ```
   - Replace `your-app` with your actual Vercel app name

4. **Database Connection**
   - The `DATABASE_URL` is automatically set from the linked database
   - No manual configuration needed if using render.yaml

### Option B: Manual Setup

1. **Create PostgreSQL Database**
   - Go to Render Dashboard → "New +" → "PostgreSQL"
   - Name: `taskero-db`
   - Plan: Free (or your preferred plan)
   - Note the **Internal Database URL** (for use later)

2. **Create Web Service**
   - Go to Render Dashboard → "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `taskero-backend`
     - **Region**: Choose closest to your users
     - **Branch**: `main` (or your default branch)
     - **Root Directory**: Leave empty (uses repo root)
     - **Runtime**: `Python 3`
     - **Build Command**:
       ```bash
       cd backend && pip install -r requirements.txt && python manage.py collectstatic --noinput
       ```
     - **Start Command**:
       ```bash
       cd backend && python manage.py migrate && gunicorn taskero_backend.wsgi:application --bind 0.0.0.0:$PORT
       ```

3. **Set Environment Variables**
   - Click on your service → **Environment** tab
   - Add the following variables:

   ```
   DJANGO_SETTINGS_MODULE=taskero_backend.settings_production
   SECRET_KEY=your-super-secret-key-here-generate-a-new-one
   DEBUG=False
   DATABASE_URL=<Internal Database URL from step 1>
   ALLOWED_HOSTS=taskero-backend.onrender.com,localhost,127.0.0.1
   CORS_ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:3000
   SECURE_SSL_REDIRECT=True
   SESSION_COOKIE_SECURE=True
   CSRF_COOKIE_SECURE=True
   PYTHON_VERSION=3.11.0
   ```

4. **Link Database** (if not using DATABASE_URL directly)
   - In your web service, go to **Settings** → **Environment**
   - Scroll to **Database** section
   - Click "Link" next to your `taskero-db` database
   - The `DATABASE_URL` will be automatically set

## Step 2: Deploy Frontend to Vercel

1. **Prepare Environment Variables**
   - In your Vercel project settings, add:
     ```
     NEXT_PUBLIC_API_BASE_URL=https://taskero-backend.onrender.com
     ```
   - Replace `taskero-backend` with your actual Render service name

2. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Set root directory to `client` (if your frontend is in a subdirectory)
   - Vercel will auto-detect Next.js and deploy

3. **Get Your Vercel URL**
   - After deployment, note your Vercel app URL
   - Format: `https://your-app.vercel.app`

## Step 3: Configure CORS (Critical for Vercel Communication)

### Backend (Render)

1. **Update CORS_ALLOWED_ORIGINS in Render**
   - Go to your Render service → **Environment** tab
   - Update `CORS_ALLOWED_ORIGINS` to include your Vercel URL:
     ```
     https://your-app.vercel.app,https://your-app-git-main.vercel.app,http://localhost:3000
     ```
   - Include both production and preview URLs if needed
   - For preview deployments, you might want to use regex (see below)

2. **For Dynamic Preview URLs (Optional)**
   - If you want to support all Vercel preview deployments, edit `backend/taskero_backend/settings_production.py`
   - Uncomment the `CORS_ALLOWED_ORIGIN_REGEXES` section:
     ```python
     CORS_ALLOWED_ORIGIN_REGEXES = [
         r"^https://.*\.vercel\.app$",
     ]
     ```
   - Then redeploy your backend

### Frontend (Vercel)

1. **Set API Base URL**
   - In Vercel project settings → **Environment Variables**
   - Add: `NEXT_PUBLIC_API_BASE_URL=https://taskero-backend.onrender.com`
   - Apply to: Production, Preview, and Development

2. **Verify API Configuration**
   - Check `client/src/constants/index.ts` uses the environment variable:
     ```typescript
     export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
     ```

## Step 4: Verify Connection

1. **Test Backend Health**
   ```bash
   curl https://taskero-backend.onrender.com/api/
   ```

2. **Test from Frontend**
   - Open your Vercel-deployed app
   - Open browser DevTools → Network tab
   - Try to sign in or make an API call
   - Check for CORS errors in the console

3. **Common Issues**

   **CORS Error:**
   - Verify `CORS_ALLOWED_ORIGINS` includes your exact Vercel URL (with https://)
   - Check that your Vercel URL matches exactly (no trailing slashes)
   - Restart Render service after updating environment variables

   **401 Unauthorized:**
   - Check that API requests include Authorization headers
   - Verify JWT tokens are being sent correctly
   - Check browser console for token storage issues

   **502 Bad Gateway:**
   - Check Render service logs for errors
   - Verify DATABASE_URL is correctly set
   - Ensure migrations ran successfully

## Step 5: Post-Deployment Checklist

- [ ] Backend service is running on Render
- [ ] Database is connected and migrations are applied
- [ ] `CORS_ALLOWED_ORIGINS` includes Vercel production URL
- [ ] `ALLOWED_HOSTS` includes Render service URL
- [ ] Frontend `NEXT_PUBLIC_API_BASE_URL` points to Render backend
- [ ] Test signup/login functionality
- [ ] Test API calls from frontend
- [ ] Verify static files are being served correctly
- [ ] Check logs for any errors

## Environment Variables Summary

### Render (Backend)
```
DJANGO_SETTINGS_MODULE=taskero_backend.settings_production
SECRET_KEY=<generate-a-secure-random-key>
DEBUG=False
DATABASE_URL=<auto-set-by-render-if-linked>
ALLOWED_HOSTS=taskero-backend.onrender.com,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:3000
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
PYTHON_VERSION=3.11.0
```

### Vercel (Frontend)
```
NEXT_PUBLIC_API_BASE_URL=https://taskero-backend.onrender.com
```

## Troubleshooting

### ModuleNotFoundError: No module named 'your_application'

This error occurs when Render is using a placeholder start command instead of your actual configuration.

**Solution:**

1. **If using render.yaml:**
   - Go to your Render service dashboard
   - Click on **Settings** → **Service Details**
   - Verify that **Start Command** shows:
     ```
     cd backend && python manage.py migrate && gunicorn taskero_backend.wsgi:application --bind 0.0.0.0:$PORT
     ```
   - If it shows `your_application` or something else, update it to the command above
   - Click **Save Changes** and redeploy

2. **If manually configured:**
   - Go to your Render service → **Settings** tab
   - Scroll to **Start Command** section
   - Replace any placeholder with:
     ```
     cd backend && python manage.py migrate && gunicorn taskero_backend.wsgi:application --bind 0.0.0.0:$PORT
     ```
   - Ensure **Root Directory** is empty (not set to `backend`)
   - Save and redeploy

3. **Verify the command:**
   - The correct module path is: `taskero_backend.wsgi:application`
   - Make sure you're in the `backend` directory when running gunicorn
   - The `taskero_backend` folder should be inside the `backend` directory

### Backend Not Starting
- Check Render logs for Python errors
- Verify all dependencies are in `requirements.txt`
- Ensure `DJANGO_SETTINGS_MODULE` is correct
- Verify the start command uses `taskero_backend.wsgi:application` (not `your_application`)

### Database Connection Errors
- Verify `DATABASE_URL` is set correctly
- Check that database service is running
- Ensure database is linked to web service (if using Render's linking feature)

### CORS Errors
- Double-check `CORS_ALLOWED_ORIGINS` includes exact Vercel URL
- Ensure URL includes `https://` protocol
- Check for trailing slashes
- Restart Render service after changes

### Static Files Not Loading
- Verify `collectstatic` ran during build
- Check `STATIC_ROOT` is set correctly
- Ensure WhiteNoise middleware is in `MIDDLEWARE`

## Support

For issues specific to:
- **Render**: Check Render documentation at https://render.com/docs
- **Vercel**: Check Vercel documentation at https://vercel.com/docs
- **Django CORS**: Check django-cors-headers at https://github.com/adamchainz/django-cors-headers
