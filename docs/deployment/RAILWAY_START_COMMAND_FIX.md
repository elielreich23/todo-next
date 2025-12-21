# Fix: Railway "run: command not found" Error

## Problem

You're seeing this error in Railway:
```
/bin/bash: line 1: run: command not found
```

This happens when Railway's start command is incorrectly configured.

## Solution

### Step 1: Check Railway Start Command

1. Go to [Railway Dashboard](https://railway.app)
2. Select your project → backend service
3. Go to **Settings** tab
4. Scroll to **Deploy** section
5. Check the **Start Command** field

### Step 2: Fix the Start Command

The start command should be:

```bash
cd backend && python manage.py migrate && gunicorn taskero_backend.wsgi:application --bind 0.0.0.0:$PORT
```

**Common mistakes:**
- ❌ `run python manage.py ...` (wrong - "run" is not a command)
- ❌ `python run.py` (wrong - this is for local dev)
- ❌ `python manage.py runserver` (wrong - this is for dev, not production)
- ✅ `cd backend && python manage.py migrate && gunicorn taskero_backend.wsgi:application --bind 0.0.0.0:$PORT` (correct)

### Step 3: Update in Railway

1. In Railway Settings → **Start Command**
2. Replace with:
   ```
   cd backend && python manage.py migrate && gunicorn taskero_backend.wsgi:application --bind 0.0.0.0:$PORT
   ```
3. Click **Save**
4. Railway will automatically redeploy

### Step 4: Verify Root Directory

1. In the same **Settings** tab
2. Check **Root Directory** field
3. It should be **EMPTY** (not set to `backend`)
4. If it's set, clear it

## Alternative: Use Procfile

Railway can also use a `Procfile` if it's in the root directory:

1. **If Procfile is in root** (`/Procfile`):
   ```
   web: cd backend && python manage.py migrate && gunicorn taskero_backend.wsgi:application --bind 0.0.0.0:$PORT
   ```

2. **If Procfile is in backend** (`/backend/Procfile`):
   - Set **Root Directory** to `backend` in Railway
   - Railway will use the Procfile automatically

## Current Procfile Location

Your Procfile is at: `backend/Procfile`

**Option A: Move Procfile to Root**
1. Copy `backend/Procfile` to root directory
2. Update it to:
   ```
   web: cd backend && python manage.py migrate && gunicorn taskero_backend.wsgi:application --bind 0.0.0.0:$PORT
   ```
3. Set Root Directory to empty in Railway

**Option B: Keep Procfile in Backend**
1. Set Root Directory to `backend` in Railway
2. Railway will use `backend/Procfile` automatically

## Quick Fix Checklist

- [ ] Go to Railway → Settings → Start Command
- [ ] Set to: `cd backend && python manage.py migrate && gunicorn taskero_backend.wsgi:application --bind 0.0.0.0:$PORT`
- [ ] Clear Root Directory (set to empty)
- [ ] Save changes
- [ ] Wait for redeploy
- [ ] Check logs - should see "Starting gunicorn" instead of errors

## Verify It's Working

After fixing, check Railway logs. You should see:
```
Operations to perform:
  Apply all migrations: ...
[INFO] Starting gunicorn ...
```

Instead of:
```
/bin/bash: line 1: run: command not found
```

## Still Having Issues?

1. **Check Railway logs** for the exact error
2. **Verify the command** - copy/paste it exactly as shown above
3. **Check Python path** - Railway should auto-detect Python
4. **Verify gunicorn is installed** - check `requirements.txt` includes `gunicorn`
