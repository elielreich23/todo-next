# Deployment Guide

This guide provides step-by-step instructions for deploying both the frontend (Next.js) to Vercel and the backend (Django) to various platforms.

---

## Part 1: Frontend Deployment on Vercel

### Prerequisites
- GitHub account with your repository
- Vercel account (free tier available)

### Step 1: Prepare Your Frontend

1. **Create a `vercel.json` file** in the `client` directory (optional, for custom configuration):

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm ci",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

2. **Update `next.config.mjs`** to handle environment variables:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
  },
};

export default nextConfig;
```

### Step 2: Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard (Recommended for First Time)

1. **Sign up/Login to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with your GitHub account

2. **Import Your Project**
   - Click "Add New..." → "Project"
   - Select your GitHub repository
   - Choose the repository: `todo-next`

3. **Configure Project Settings**
   - **Root Directory**: Set to `client` (click "Edit" next to Root Directory)
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm ci` (default)

4. **Environment Variables**
   - Click "Environment Variables"
   - Add: `NEXT_PUBLIC_API_BASE_URL` = `https://your-backend-url.com` (you'll update this after deploying backend)
   - For now, you can use a placeholder or your backend URL if already deployed

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (usually 2-5 minutes)
   - Your app will be live at `https://your-project.vercel.app`

#### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Navigate to client directory**
   ```bash
   cd client
   ```

4. **Deploy**
   ```bash
   vercel
   ```
   - Follow the prompts
   - When asked for root directory, confirm it's the current directory
   - Set environment variables when prompted

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

### Step 3: Configure Custom Domain (Optional)

1. Go to your project settings in Vercel dashboard
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

---

## Part 2: Backend Deployment Options

### Option 1: Railway (Recommended - Easy & Free Tier Available)

#### Step 1: Prepare Backend for Railway

1. **Create `Procfile`** in `backend` directory:
   ```
   web: python manage.py migrate && python manage.py collectstatic --noinput && gunicorn taskero_backend.wsgi:application --bind 0.0.0.0:$PORT
   ```

2. **Update `requirements.txt`** to include production dependencies:
   ```
   Django==5.1.4
   djangorestframework==3.15.2
   djangorestframework-simplejwt==5.3.1
   django-cors-headers==4.4.0
   setuptools
   gunicorn==21.2.0
   psycopg2-binary==2.9.9
   python-decouple==3.8
   whitenoise==6.6.0
   ```

3. **Update `settings.py`** for production:
   - Add environment variable support
   - Configure CORS for your Vercel domain
   - Set up database (PostgreSQL recommended)

#### Step 2: Deploy to Railway

1. **Sign up for Railway**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure Service**
   - Railway will detect it's a Python project
   - **Root Directory**: Set to `backend`
   - **Start Command**: `python manage.py migrate && gunicorn taskero_backend.wsgi:application --bind 0.0.0.0:$PORT`

4. **Add PostgreSQL Database**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will automatically provide `DATABASE_URL` environment variable

5. **Set Environment Variables**
   - `SECRET_KEY`: Generate a secure key (use `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`)
   - `DEBUG`: `False`
   - `DJANGO_SETTINGS_MODULE`: `taskero_backend.settings`
   - `ALLOWED_HOSTS`: `your-app.railway.app,your-vercel-domain.vercel.app`
   - `CORS_ALLOWED_ORIGINS`: `https://your-vercel-domain.vercel.app`

6. **Deploy**
   - Railway will automatically deploy on push to main branch
   - Get your backend URL from the service settings

7. **Update Frontend Environment Variable**
   - Go back to Vercel
   - Update `NEXT_PUBLIC_API_BASE_URL` to your Railway backend URL

---

### Option 2: Render (Free Tier Available)

#### Step 1: Prepare Backend

1. Create `render.yaml` in root directory:
   ```yaml
   services:
     - type: web
       name: taskero-backend
       env: python
       buildCommand: pip install -r backend/requirements.txt
       startCommand: cd backend && gunicorn taskero_backend.wsgi:application --bind 0.0.0.0:$PORT
       envVars:
         - key: SECRET_KEY
           generateValue: true
         - key: DEBUG
           value: False
         - key: DJANGO_SETTINGS_MODULE
           value: taskero_backend.settings
   ```

2. Update `requirements.txt` (same as Railway)

#### Step 2: Deploy to Render

1. **Sign up for Render**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create New Web Service**
   - Click "New" → "Web Service"
   - Connect your GitHub repository

3. **Configure Service**
   - **Name**: `taskero-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && gunicorn taskero_backend.wsgi:application --bind 0.0.0.0:$PORT`
   - **Root Directory**: `backend`

4. **Add PostgreSQL Database**
   - Click "New" → "PostgreSQL"
   - Render will provide `DATABASE_URL`

5. **Set Environment Variables**
   - Same as Railway configuration

6. **Deploy**
   - Click "Create Web Service"
   - Render will deploy automatically

---

### Option 3: DigitalOcean App Platform

#### Step 1: Prepare Backend

1. Create `.do/app.yaml` in root directory:
   ```yaml
   name: taskero-backend
   services:
     - name: backend
       source_dir: backend
       github:
         repo: your-username/todo-next
         branch: main
       run_command: gunicorn taskero_backend.wsgi:application --bind 0.0.0.0:8080
       environment_slug: python
       instance_count: 1
       instance_size_slug: basic-xxs
       envs:
         - key: SECRET_KEY
           scope: RUN_TIME
           value: ${SECRET_KEY}
         - key: DEBUG
           scope: RUN_TIME
           value: "False"
         - key: DATABASE_URL
           scope: RUN_TIME
           value: ${db.DATABASE_URL}
   databases:
     - name: db
       engine: PG
       version: "14"
   ```

#### Step 2: Deploy to DigitalOcean

1. **Sign up for DigitalOcean**
   - Go to [digitalocean.com](https://digitalocean.com)
   - Create account

2. **Create App**
   - Go to App Platform
   - Click "Create App"
   - Connect GitHub repository

3. **Configure**
   - DigitalOcean will auto-detect the configuration
   - Review and adjust settings
   - Add environment variables

4. **Deploy**
   - Click "Create Resources"
   - Wait for deployment

---

### Option 4: AWS (Elastic Beanstalk or EC2)

#### Using Elastic Beanstalk (Easier)

1. **Install EB CLI**
   ```bash
   pip install awsebcli
   ```

2. **Initialize EB**
   ```bash
   cd backend
   eb init -p python-3.10 taskero-backend
   ```

3. **Create Environment**
   ```bash
   eb create taskero-env
   ```

4. **Configure Environment Variables**
   ```bash
   eb setenv SECRET_KEY=your-secret-key DEBUG=False
   ```

5. **Deploy**
   ```bash
   eb deploy
   ```

---

## Part 3: Database Setup

### For Production, use PostgreSQL instead of SQLite:

1. **Update `settings.py`**:
   ```python
   import os
   import dj_database_url

   # Database
   DATABASES = {
       'default': dj_database_url.config(
           default=os.environ.get('DATABASE_URL', 'sqlite:///db.sqlite3'),
           conn_max_age=600
       )
   }
   ```

2. **Add to `requirements.txt`**:
   ```
   dj-database-url==2.1.0
   psycopg2-binary==2.9.9
   ```

3. **Run migrations**:
   ```bash
   python manage.py migrate
   ```

---

## Part 4: Update Settings for Production

### Update `backend/taskero_backend/settings.py`:

```python
import os
from pathlib import Path
import dj_database_url

# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-here')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# CORS settings
CORS_ALLOWED_ORIGINS = os.environ.get(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:3000'
).split(',')

CORS_ALLOW_CREDENTIALS = True

# Database
DATABASES = {
    'default': dj_database_url.config(
        default=os.environ.get('DATABASE_URL', 'sqlite:///db.sqlite3'),
        conn_max_age=600
    )
}

# Static files (for production)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Add WhiteNoise for static files
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Add this
    # ... rest of middleware
]
```

---

## Part 5: Post-Deployment Checklist

### Frontend (Vercel)
- [ ] Environment variables set correctly
- [ ] API URL points to deployed backend
- [ ] Custom domain configured (if needed)
- [ ] SSL certificate active (automatic on Vercel)

### Backend
- [ ] Database migrations run
- [ ] Static files collected
- [ ] Environment variables configured
- [ ] CORS configured for frontend domain
- [ ] Admin user created
- [ ] Health check endpoint working

### Testing
- [ ] Frontend loads correctly
- [ ] API calls work from frontend
- [ ] Authentication works
- [ ] Database operations work
- [ ] File uploads work (if applicable)

---

## Quick Reference: Environment Variables

### Frontend (Vercel)
```
NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.com
```

### Backend (Railway/Render/etc.)
```
SECRET_KEY=your-secret-key-here
DEBUG=False
DJANGO_SETTINGS_MODULE=taskero_backend.settings
DATABASE_URL=postgresql://user:pass@host:port/dbname
ALLOWED_HOSTS=your-backend-url.com,your-frontend-url.vercel.app
CORS_ALLOWED_ORIGINS=https://your-frontend-url.vercel.app
```

---

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure `CORS_ALLOWED_ORIGINS` includes your Vercel domain
   - Check that credentials are allowed if using cookies

2. **Database Connection Errors**
   - Verify `DATABASE_URL` is set correctly
   - Check database is accessible from your backend host

3. **Static Files Not Loading**
   - Run `python manage.py collectstatic`
   - Ensure WhiteNoise is configured

4. **Build Failures**
   - Check build logs in deployment platform
   - Verify all dependencies in `requirements.txt`
   - Ensure Python version matches

---

## Cost Estimates

- **Vercel**: Free tier (hobby) - $0/month
- **Railway**: Free tier available, then $5/month
- **Render**: Free tier available, then $7/month
- **DigitalOcean**: Starts at $5/month
- **AWS**: Pay-as-you-go, can be $10-50/month depending on usage

---

## Need Help?

- Check platform-specific documentation
- Review deployment logs
- Test locally with production-like settings
- Use platform support channels
