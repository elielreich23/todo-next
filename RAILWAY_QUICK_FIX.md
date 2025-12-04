# Quick Fix: Railway DisallowedHost Error

## Immediate Fix (2 minutes)

### Step 1: Set Environment Variables in Railway

1. Go to Railway Dashboard → Your Service → **Variables** tab
2. Add/Update these variables:

   ```
   DJANGO_SETTINGS_MODULE=taskero_backend.settings_production
   ALLOWED_HOSTS=todo-next-production.up.railway.app,localhost,127.0.0.1
   ```

   **Important:** Replace `todo-next-production.up.railway.app` with your actual Railway domain.

3. Click **Save** or **Deploy**

### Step 2: Restart Service

1. Railway will automatically redeploy after saving variables
2. Wait for deployment to complete (~1-2 minutes)
3. Test your API: `https://todo-next-production.up.railway.app/api/`

## What Was Fixed

✅ Created `railway_middleware.py` - Automatically allows Railway domains
✅ Updated `settings_production.py` - Better Railway domain detection
✅ Added middleware to production settings - Handles dynamic Railway domains

## How to Find Your Railway Domain

1. Railway Dashboard → Your Service → **Settings** tab
2. Look for **Public Domain** section
3. Copy the domain (e.g., `todo-next-production.up.railway.app`)
4. Use it in `ALLOWED_HOSTS`

## Verification

After setting the variables, check Railway logs. You should see:
- "Using settings module taskero_backend.settings_production" (not `settings`)
- No more DisallowedHost errors

## Still Not Working?

1. **Check logs:** Railway → Your Service → **Deployments** → Click latest → **View Logs**
2. **Verify variables:** Make sure `DJANGO_SETTINGS_MODULE` is exactly: `taskero_backend.settings_production`
3. **Check domain:** Make sure `ALLOWED_HOSTS` includes your exact Railway domain
4. **Restart:** Manually trigger a redeploy if needed

## Full Documentation

See `RAILWAY_ALLOWED_HOSTS_FIX.md` for detailed explanation.
