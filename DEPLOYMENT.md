# Deployment Guide

Complete guide for deploying Taskero to production. This document covers deployment to Render, Railway, Vercel, and other platforms.

---

## Table of Contents

- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Deployment Platforms](#deployment-platforms)
  - [Railway + Vercel](#railway--vercel-recommended)
  - [Render + Vercel](#render--vercel)
- [Environment Variables](#environment-variables)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)
- [Production Checklist](#production-checklist)

---

## Pre-Deployment Checklist

### Frontend (Next.js)
- [ ] All environment variables documented
- [ ] `next.config.mjs` configured correctly
- [ ] `vercel.json` created (optional)
- [ ] Build passes locally: `npm run build`
- [ ] Linting passes: `npm run lint`
- [ ] Type checking passes: `npm run type-check`

### Backend (Django)
- [ ] `requirements.txt` or `requirements-production.txt` updated
- [ ] `Procfile` created for platform deployment
- [ ] Production settings configured (`settings_production.py`)
- [ ] Database migrations ready
- [ ] Static files configuration set up
- [ ] CORS settings configured for frontend domain
- [ ] Secret key generated (not using default)
- [ ] DEBUG set to False for production

---

## Deployment Platforms

### Railway + Vercel (Recommended)

#### Step 1: Deploy Backend to Railway

1. **Create Railway Account**
   - Go to [Railway](https://railway.app)
   - Sign up/login with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure Service**
   - Railway will auto-detect Django
   - Set root directory to `backend` (if needed)
   - Add PostgreSQL database (if needed)

4. **Set Environment Variables**
   ```
   DJANGO_SETTINGS_MODULE=taskero_backend.settings_production
   SECRET_KEY=<generate-new-secret-key>
   DEBUG=False
   ALLOWED_HOSTS=your-app.up.railway.app,localhost,127.0.0.1
   CORS_ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:3000
   DATABASE_URL=<auto-set-by-railway-if-linked>
   ```

5. **Get Railway URL**
   - Go to Settings → Public Domain
   - Copy your Railway URL (e.g., `https://your-app.up.railway.app`)

#### Step 2: Deploy Frontend to Vercel

1. **Create Vercel Account**
   - Go to [Vercel](https://vercel.com)
   - Sign up/login with GitHub

2. **Import Project**
   - Click "Add New Project"
   - Import your GitHub repository
   - Set root directory to `client`

3. **Set Environment Variables**
   ```
   NEXT_PUBLIC_API_BASE_URL=https://your-app.up.railway.app
   ```

4. **Deploy**
   - Vercel will automatically deploy
   - Get your Vercel URL (e.g., `https://your-app.vercel.app`)

#### Step 3: Connect Frontend to Backend

1. **Update Railway CORS**
   - Go to Railway → Variables
   - Update `CORS_ALLOWED_ORIGINS`:
     ```
     CORS_ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-app-git-main.vercel.app,http://localhost:3000
     ```

2. **Restart Railway Service**
   - Railway will auto-redeploy after variable changes

3. **Test Connection**
   - Open your Vercel app
   - Check browser console for API calls
   - Verify no CORS errors

#### Quick Setup Reference

See `QUICK_SETUP_RAILWAY_VERCEL.md` for a quick checklist.

---

### Render + Vercel

#### Step 1: Deploy Backend to Render

**Option A: Using render.yaml (Recommended)**

1. **Push Code to GitHub**
   ```bash
   git add .
   git commit -m "Configure Render deployment"
   git push origin main
   ```

2. **Connect to Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will auto-detect `render.yaml`

3. **Update Environment Variables**
   - Go to your service → Environment tab
   - Update `CORS_ALLOWED_ORIGINS` with your Vercel URL

**Option B: Manual Setup**

1. **Create PostgreSQL Database**
   - Render Dashboard → "New +" → "PostgreSQL"
   - Name: `taskero-db`
   - Note the Internal Database URL

2. **Create Web Service**
   - Render Dashboard → "New +" → "Web Service"
   - Connect GitHub repository
   - Configure:
     - **Name**: `taskero-backend`
     - **Runtime**: `Python 3`
     - **Build Command**: `cd backend && pip install -r requirements.txt && python manage.py collectstatic --noinput`
     - **Start Command**: `cd backend && python manage.py migrate && gunicorn taskero_backend.wsgi:application --bind 0.0.0.0:$PORT`

3. **Set Environment Variables**
   ```
   DJANGO_SETTINGS_MODULE=taskero_backend.settings_production
   SECRET_KEY=<generate-new-secret-key>
   DEBUG=False
   DATABASE_URL=<from-step-1>
   ALLOWED_HOSTS=taskero-backend.onrender.com,localhost,127.0.0.1
   CORS_ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:3000
   SECURE_SSL_REDIRECT=True
   SESSION_COOKIE_SECURE=True
   CSRF_COOKIE_SECURE=True
   ```

#### Step 2: Deploy Frontend to Vercel

Same as Railway + Vercel section above.

#### Common Issues

**ModuleNotFoundError: No module named 'your_application'**
- Go to Render → Settings → Start Command
- Update to: `cd backend && python manage.py migrate && gunicorn taskero_backend.wsgi:application --bind 0.0.0.0:$PORT`
- Ensure Root Directory is empty (not set to `backend`)

See `RENDER_FIX_MODULE_ERROR.md` for detailed troubleshooting.

---

## Environment Variables

### Backend (Railway/Render)

**Required:**
```
DJANGO_SETTINGS_MODULE=taskero_backend.settings_production
SECRET_KEY=<generate-secure-random-key>
DEBUG=False
ALLOWED_HOSTS=your-backend-domain.com,localhost,127.0.0.1
DATABASE_URL=<auto-set-by-platform-if-linked>
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com,http://localhost:3000
```

**Optional:**
```
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
PYTHON_VERSION=3.11.0
```

### Frontend (Vercel)

**Required:**
```
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.com
```

### Generate Django Secret Key

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

---

## Post-Deployment

### Testing

- [ ] Frontend loads correctly
- [ ] Can sign up new user
- [ ] Can sign in
- [ ] API calls work (check browser console)
- [ ] No CORS errors
- [ ] Database operations work
- [ ] Static files load correctly

### Create Admin User

**Railway:**
```bash
# Quick method - creates default admin (admin@taskero.com / admin123)
railway run python backend/create_admin.py

# Or use interactive method
railway run python backend/manage.py createsuperuser
```

**Render:**
```bash
# Use Render shell
python manage.py createsuperuser
```

**For detailed instructions, see [RAILWAY_ADMIN_SETUP.md](./RAILWAY_ADMIN_SETUP.md)**

### Run Migrations

Migrations should run automatically during deployment. If not:

**Railway:**
```bash
railway run python manage.py migrate
```

**Render:**
Migrations run automatically via start command.

---

## Troubleshooting

### CORS Errors

**Symptoms:** Browser console shows CORS policy errors

**Solution:**
1. Verify `CORS_ALLOWED_ORIGINS` includes exact frontend URL
2. Ensure URL includes `https://` protocol
3. Check for trailing slashes (should not have one)
4. Restart backend service after updating variables

**Test CORS:**
```bash
curl -H "Origin: https://your-frontend.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -v https://your-backend.com/api/
```

### 401 Unauthorized

**Symptoms:** API requests return 401 errors

**Solution:**
1. Check Authorization headers are being sent
2. Verify JWT tokens are stored correctly in localStorage
3. Check token refresh is working
4. Verify API endpoint URLs are correct

### 502 Bad Gateway

**Symptoms:** Backend returns 502 errors

**Solution:**
1. Check backend service logs
2. Verify `DATABASE_URL` is correctly set
3. Ensure migrations ran successfully
4. Check that backend service is running
5. Verify start command is correct

### DisallowedHost Error (Railway)

**Symptoms:** `Invalid HTTP_HOST header: 'your-app.up.railway.app'`

**Solution:**
1. Set `DJANGO_SETTINGS_MODULE=taskero_backend.settings_production` in Railway
2. Add domain to `ALLOWED_HOSTS`:
   ```
   ALLOWED_HOSTS=your-app.up.railway.app,localhost,127.0.0.1
   ```
3. Restart Railway service

See `RAILWAY_ALLOWED_HOSTS_FIX.md` for detailed steps.

### ModuleNotFoundError (Render)

**Symptoms:** `ModuleNotFoundError: No module named 'your_application'`

**Solution:**
1. Go to Render → Settings → Start Command
2. Update to: `cd backend && python manage.py migrate && gunicorn taskero_backend.wsgi:application --bind 0.0.0.0:$PORT`
3. Ensure Root Directory is empty

### Database Connection Errors

**Symptoms:** Database connection failures

**Solution:**
1. Verify `DATABASE_URL` is correct
2. Check database service is running
3. Ensure database is linked to web service
4. Check database credentials

### Static Files Not Loading

**Symptoms:** CSS/JS files return 404

**Solution:**
1. Verify `collectstatic` ran during build
2. Check `STATIC_ROOT` is set correctly
3. Ensure WhiteNoise middleware is in `MIDDLEWARE`
4. Verify static files path in settings

---

## Production Checklist

### Security

- [ ] `DEBUG = False` in production
- [ ] Strong `SECRET_KEY` set (not default)
- [ ] `ALLOWED_HOSTS` properly configured
- [ ] HTTPS redirects enabled
- [ ] Secure cookies enabled (`SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`)
- [ ] Database credentials secured
- [ ] CORS properly configured (specific origins, not wildcards)
- [ ] Environment variables not exposed in frontend

### Performance

- [ ] Database connection pooling configured
- [ ] Static files served efficiently (WhiteNoise or CDN)
- [ ] Gunicorn workers configured appropriately
- [ ] Caching configured (if applicable)
- [ ] Database indexes optimized

### Monitoring

- [ ] Error tracking set up (optional: Sentry)
- [ ] Logging configured
- [ ] Health checks configured
- [ ] Database performance monitored
- [ ] API response times monitored

### Frontend

- [ ] Environment variables configured
- [ ] API base URL points to production backend
- [ ] Build succeeds without errors
- [ ] No console errors in production
- [ ] Images optimized
- [ ] Bundle size optimized

### Backend

- [ ] Production settings file used
- [ ] Database migrations applied
- [ ] Admin user created
- [ ] Static files collected
- [ ] Logging configured
- [ ] Error handling in place

---

## Quick Reference

### Generate Secret Key
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### Run Migrations
```bash
python manage.py migrate
```

### Collect Static Files
```bash
python manage.py collectstatic --noinput
```

### Test Backend
```bash
curl https://your-backend.com/api/
```

### Test CORS
```bash
curl -H "Origin: https://your-frontend.com" -v https://your-backend.com/api/
```

---

## Platform-Specific Guides

- **Railway Quick Setup**: See `QUICK_SETUP_RAILWAY_VERCEL.md`
- **Railway Troubleshooting**: See `RAILWAY_ALLOWED_HOSTS_FIX.md` and `RAILWAY_QUICK_FIX.md`
- **Render Setup**: See `RENDER_DEPLOYMENT.md`
- **Render Troubleshooting**: See `RENDER_FIX_MODULE_ERROR.md`
- **Vercel + Railway**: See `VERCEL_RAILWAY_SETUP.md`

---

## Support

For platform-specific issues:
- **Railway**: [Railway Documentation](https://docs.railway.app)
- **Render**: [Render Documentation](https://render.com/docs)
- **Vercel**: [Vercel Documentation](https://vercel.com/docs)
- **Django**: [Django Deployment](https://docs.djangoproject.com/en/stable/howto/deployment/)
