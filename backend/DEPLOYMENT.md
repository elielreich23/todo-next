# Deployment Guide for Taskero Backend

This guide covers deploying the Taskero Django backend to Render.

## Prerequisites

1. A Render account (https://render.com)
2. Your code pushed to a GitHub repository
3. A PostgreSQL database (Render provides free tier)

## Deployment Steps

### Option 1: Using render.yaml (Recommended)

1. The `render.yaml` file in the root directory contains the complete deployment configuration
2. Connect your GitHub repository to Render
3. Render will automatically detect the `render.yaml` file and create the services

### Option 2: Manual Setup

1. **Create a Web Service:**
   - Go to Render Dashboard
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select the repository containing your Django app

2. **Configure the Service:**
   - **Name:** `taskero-backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `cd backend && pip install -r requirements.txt && python manage.py collectstatic --noinput`
   - **Start Command:** `cd backend && python manage.py migrate && gunicorn taskero_backend.wsgi:application --bind 0.0.0.0:$PORT`

3. **Set Environment Variables:**
   ```
   DJANGO_SETTINGS_MODULE=taskero_backend.settings_production
   SECRET_KEY=your-super-secret-key-here
   DEBUG=False
   ALLOWED_HOSTS=your-app-name.onrender.com
   DATABASE_URL=postgresql://user:password@host:port/database
   CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
   SECURE_SSL_REDIRECT=True
   SESSION_COOKIE_SECURE=True
   CSRF_COOKIE_SECURE=True
   ```

4. **Create PostgreSQL Database:**
   - Go to Render Dashboard
   - Click "New" → "PostgreSQL"
   - Name: `taskero-db`
   - Copy the database URL and use it for `DATABASE_URL`

## Environment Variables

### Required Variables

- `SECRET_KEY`: Django secret key (generate a new one for production)
- `DATABASE_URL`: PostgreSQL connection string from Render
- `ALLOWED_HOSTS`: Your Render app domain (e.g., `your-app.onrender.com`)

### Optional Variables

- `DEBUG`: Set to `False` for production (default: False)
- `CORS_ALLOWED_ORIGINS`: Frontend domain(s) separated by commas
- `SECURE_SSL_REDIRECT`: Enable HTTPS redirect (default: False)
- `SESSION_COOKIE_SECURE`: Secure session cookies (default: False)
- `CSRF_COOKIE_SECURE`: Secure CSRF cookies (default: False)

## Post-Deployment

1. **Create Superuser:**
   ```bash
   # Connect to your Render shell
   python manage.py createsuperuser
   ```

2. **Test API Endpoints:**
   - Visit `https://your-app.onrender.com/admin/` for Django admin
   - Test API at `https://your-app.onrender.com/api/`

## Troubleshooting

### Common Issues

1. **Static Files Not Loading:**
   - Ensure `STATIC_ROOT` is set correctly
   - WhiteNoise middleware is properly configured
   - `collectstatic` runs during build

2. **Database Connection Errors:**
   - Verify `DATABASE_URL` is correct
   - Check PostgreSQL service is running
   - Ensure migrations have run

3. **CORS Issues:**
   - Update `CORS_ALLOWED_ORIGINS` with your frontend domain
   - Include both HTTP and HTTPS versions if needed

4. **Secret Key Errors:**
   - Generate a new secret key for production
   - Never use the development secret key in production

### Logs

Access logs through Render dashboard:
- Go to your service
- Click on "Logs" tab
- Monitor for errors and debug issues

## Security Checklist

- ✅ `DEBUG = False` in production
- ✅ Strong `SECRET_KEY` set
- ✅ `ALLOWED_HOSTS` properly configured
- ✅ HTTPS redirects enabled
- ✅ Secure cookies enabled
- ✅ Database credentials secured
- ✅ CORS properly configured

## Performance Optimization

1. **Database Connection Pooling:**
   - Already configured with `conn_max_age=600`

2. **Static Files:**
   - WhiteNoise handles static file serving efficiently

3. **Gunicorn Configuration:**
   - Default configuration should work for most cases
   - For high traffic, consider adjusting worker count

## Monitoring

- Use Render's built-in monitoring
- Set up health checks if needed
- Monitor database performance
- Watch for memory usage patterns
