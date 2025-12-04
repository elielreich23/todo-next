# Fix: ModuleNotFoundError: No module named 'your_application'

This error occurs when Render is using a placeholder start command instead of your actual Django application module.

## Quick Fix

### Step 1: Go to Render Dashboard
1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click on your `taskero-backend` service

### Step 2: Update Start Command
1. Click on **Settings** tab
2. Scroll down to **Start Command** section
3. **Replace** the current command with:
   ```bash
   cd backend && python manage.py migrate && gunicorn taskero_backend.wsgi:application --bind 0.0.0.0:$PORT
   ```
4. **Important:** Make sure it says `taskero_backend.wsgi:application` (NOT `your_application`)

### Step 3: Verify Root Directory
1. In the same **Settings** tab
2. Check **Root Directory** field
3. **It should be EMPTY** (not set to `backend`)
4. If it's set to `backend`, clear it

### Step 4: Save and Redeploy
1. Click **Save Changes** at the bottom
2. Render will automatically redeploy
3. Wait for deployment to complete
4. Check the logs to verify it's working

## Alternative: Use Blueprint (Recommended)

If you want Render to automatically use `render.yaml`:

1. **Delete** your current service (or create a new one)
2. Go to Render Dashboard → **New +** → **Blueprint**
3. Connect your GitHub repository
4. Render will automatically detect `render.yaml` and create services with correct configuration
5. No manual configuration needed!

## Verify It's Working

After redeploying, check the logs:
1. Go to your service → **Logs** tab
2. You should see:
   ```
   Operations to perform:
     Apply all migrations: ...
   ```
   ```
   [INFO] Starting gunicorn ...
   ```
3. If you see `ModuleNotFoundError`, the start command is still wrong

## Common Mistakes

❌ **Wrong:**
```bash
gunicorn your_application.wsgi:application
gunicorn wsgi:application
gunicorn backend.wsgi:application
```

✅ **Correct:**
```bash
cd backend && gunicorn taskero_backend.wsgi:application --bind 0.0.0.0:$PORT
```

## Still Having Issues?

1. **Check your project structure:**
   ```
   backend/
     ├── manage.py
     ├── taskero_backend/
     │   ├── __init__.py
     │   ├── wsgi.py  ← This file should exist
     │   └── settings.py
     └── ...
   ```

2. **Verify wsgi.py exists and has:**
   ```python
   application = get_wsgi_application()
   ```

3. **Check Render logs** for the exact error message
4. **Verify** you're using the correct Python version (3.11.0 as specified in render.yaml)
