# Fix: DisallowedHost Error on Railway

## Problem

You're seeing this error:
```
Invalid HTTP_HOST header: 'todo-next-production.up.railway.app'.
You may need to add 'todo-next-production.up.railway.app' to ALLOWED_HOSTS.
```

This happens because:
1. Railway is using development settings instead of production settings
2. The Railway domain is not in `ALLOWED_HOSTS`

## Solution

### Option 1: Set Environment Variable in Railway (Recommended)

1. Go to your Railway project dashboard
2. Click on your backend service
3. Go to **Variables** tab
4. Add/update these environment variables:

   ```
   DJANGO_SETTINGS_MODULE=taskero_backend.settings_production
   ALLOWED_HOSTS=todo-next-production.up.railway.app,localhost,127.0.0.1
   ```

5. **Important:** Replace `todo-next-production.up.railway.app` with your actual Railway domain
6. Restart your Railway service

### Option 2: Use Railway's Auto-Detection (Already Implemented)

The code now includes:
- Auto-detection of Railway domains
- Middleware to handle Railway domains dynamically
- Support for `RAILWAY_PUBLIC_DOMAIN` environment variable

**Just make sure:**
1. Set `DJANGO_SETTINGS_MODULE=taskero_backend.settings_production` in Railway
2. The middleware will automatically allow `.up.railway.app` domains

### Option 3: Quick Fix - Add Domain Manually

If you need a quick fix, you can temporarily add the domain in `settings_production.py`:

```python
ALLOWED_HOSTS = [
    "todo-next-production.up.railway.app",
    "localhost",
    "127.0.0.1",
]
```

But **Option 1 is recommended** for production.

## Step-by-Step Fix

### Step 1: Verify Settings Module

1. In Railway, go to **Variables** tab
2. Check if `DJANGO_SETTINGS_MODULE` is set
3. If not set or set to `taskero_backend.settings`, update it to:
   ```
   DJANGO_SETTINGS_MODULE=taskero_backend.settings_production
   ```

### Step 2: Set ALLOWED_HOSTS

1. In Railway **Variables** tab, add:
   ```
   ALLOWED_HOSTS=todo-next-production.up.railway.app,localhost,127.0.0.1
   ```
2. Replace `todo-next-production.up.railway.app` with your actual domain

### Step 3: Get Your Railway Domain

1. Go to Railway service → **Settings** tab
2. Find **Public Domain** section
3. Copy the domain (e.g., `todo-next-production.up.railway.app`)
4. Use it in `ALLOWED_HOSTS`

### Step 4: Restart Service

1. After updating environment variables, restart your Railway service
2. Wait for deployment to complete
3. Test the API endpoint

## Verify It's Working

After fixing, test your API:

```bash
curl https://todo-next-production.up.railway.app/api/
```

You should get a response (not a DisallowedHost error).

## Environment Variables Checklist

Make sure these are set in Railway:

- [ ] `DJANGO_SETTINGS_MODULE=taskero_backend.settings_production`
- [ ] `ALLOWED_HOSTS=todo-next-production.up.railway.app,localhost,127.0.0.1`
- [ ] `SECRET_KEY=<your-secret-key>`
- [ ] `DEBUG=False` (for production)
- [ ] `DATABASE_URL=<automatically set by Railway if database is linked>`
- [ ] `CORS_ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:3000`

## Why This Happens

1. **Development Settings:** Railway might be using `taskero_backend.settings` (development) instead of `taskero_backend.settings_production`
2. **Missing Domain:** The Railway domain isn't in `ALLOWED_HOSTS`
3. **Auto-Detection Failed:** Railway might not be setting `RAILWAY_PUBLIC_DOMAIN` environment variable

## Prevention

The middleware (`railway_middleware.py`) now automatically allows Railway domains, but it's still best practice to:
1. Set `DJANGO_SETTINGS_MODULE` correctly
2. Set `ALLOWED_HOSTS` explicitly in Railway environment variables
3. Use production settings in production

## Still Having Issues?

1. Check Railway logs for errors
2. Verify environment variables are set correctly
3. Make sure you restarted the service after updating variables
4. Check that `settings_production.py` is being used (check logs for "Using settings module")
