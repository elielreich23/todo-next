# Fix: "Failed to fetch" Error in Vercel App

This error occurs when the Vercel frontend cannot connect to the Railway backend. This guide will help you diagnose and fix the issue.

---

## Quick Diagnosis

### Step 1: Check Browser Console

1. Open your Vercel app
2. Open browser DevTools (F12)
3. Go to **Console** tab
4. Look for errors like:
   - `Failed to fetch`
   - `CORS policy: No 'Access-Control-Allow-Origin' header`
   - `NetworkError when attempting to fetch resource`

### Step 2: Check Network Tab

1. In DevTools, go to **Network** tab
2. Try to login/signup
3. Look for failed requests (red entries)
4. Click on the failed request
5. Check:
   - **Request URL**: Should be your Railway backend URL
   - **Status**: Usually `(failed)` or `CORS error`
   - **Response**: Check for CORS errors

---

## Common Causes & Solutions

### 1. Missing Environment Variable in Vercel

**Problem:** `NEXT_PUBLIC_API_BASE_URL` is not set in Vercel, so frontend defaults to `http://localhost:8000`

**Solution:**

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add:
   - **Name:** `NEXT_PUBLIC_API_BASE_URL`
   - **Value:** `https://todo-next-production.up.railway.app` (your Railway backend URL)
   - **Environment:** Select all (Production, Preview, Development)
5. Click **Save**
6. **Redeploy** your Vercel app (go to Deployments → click "..." → Redeploy)

**Verify:**
- After redeploy, check the built app
- The API calls should now go to your Railway backend

---

### 2. CORS Not Configured in Railway

**Problem:** Railway backend doesn't allow requests from your Vercel domain

**Solution:**

1. Go to [Railway Dashboard](https://railway.app)
2. Select your project → backend service
3. Go to **Variables** tab
4. Add/Update:
   ```
   CORS_ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://your-vercel-app-git-main.vercel.app,http://localhost:3000
   ```
   **Important:** Replace `your-vercel-app` with your actual Vercel app name

5. **Get your Vercel URL:**
   - Go to Vercel Dashboard → Your Project
   - Copy the production URL (e.g., `https://your-app.vercel.app`)

6. **Restart Railway service** (it will auto-redeploy after saving variables)

**Verify CORS:**
```bash
# Test from command line
curl -H "Origin: https://your-vercel-app.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: content-type" \
     -X OPTIONS \
     https://todo-next-production.up.railway.app/api/auth/signin/ \
     -v
```

You should see `Access-Control-Allow-Origin` in the response headers.

---

### 3. Railway Backend Not Running

**Problem:** Railway backend service is down or not responding

**Solution:**

1. Go to Railway Dashboard → Your Service
2. Check **Deployments** tab
3. Verify the latest deployment is successful (green checkmark)
4. Check **Logs** tab for errors
5. If service is down, restart it

**Test Backend:**
```bash
# Test if backend is accessible
curl https://todo-next-production.up.railway.app/api/

# Should return a response (not an error)
```

---

### 4. Wrong API URL Format

**Problem:** API URL has trailing slash or wrong format

**Solution:**

- ✅ **Correct:** `https://todo-next-production.up.railway.app`
- ❌ **Wrong:** `https://todo-next-production.up.railway.app/` (trailing slash)
- ❌ **Wrong:** `http://todo-next-production.up.railway.app` (http instead of https)

**Check in Vercel:**
1. Go to Environment Variables
2. Verify `NEXT_PUBLIC_API_BASE_URL` has no trailing slash
3. Must use `https://` (not `http://`)

---

### 5. Railway Backend Using Wrong Settings

**Problem:** Railway is using development settings instead of production

**Solution:**

1. Go to Railway → Variables
2. Verify:
   ```
   DJANGO_SETTINGS_MODULE=taskero_backend.settings_production
   ```
3. If not set, add it
4. Restart Railway service

---

## Step-by-Step Fix

### Step 1: Verify Railway Backend is Running

```bash
# Test backend health
curl https://todo-next-production.up.railway.app/api/
```

If this fails, fix Railway backend first (see Railway logs).

### Step 2: Configure Vercel Environment Variable

1. **Get your Vercel URL:**
   - Go to Vercel Dashboard
   - Copy your production URL (e.g., `https://your-app.vercel.app`)

2. **Set in Vercel:**
   - Settings → Environment Variables
   - Add: `NEXT_PUBLIC_API_BASE_URL = https://todo-next-production.up.railway.app`
   - Apply to: All environments
   - Save

3. **Redeploy Vercel:**
   - Go to Deployments
   - Click "..." on latest deployment
   - Click "Redeploy"

### Step 3: Configure Railway CORS

1. **Get your Vercel URL** (from Step 2)

2. **Set in Railway:**
   - Variables tab
   - Add: `CORS_ALLOWED_ORIGINS = https://your-vercel-app.vercel.app,http://localhost:3000`
   - Save (Railway will auto-redeploy)

3. **Wait for redeploy** (1-2 minutes)

### Step 4: Test Connection

1. Open your Vercel app
2. Open browser DevTools → Network tab
3. Try to sign up/login
4. Check the Network tab:
   - Requests should go to `https://todo-next-production.up.railway.app/api/...`
   - Status should be `200` or `201` (not `(failed)`)
   - No CORS errors in console

---

## Debugging Checklist

- [ ] Railway backend is running (check Railway logs)
- [ ] Railway backend URL is accessible: `https://todo-next-production.up.railway.app/api/`
- [ ] `NEXT_PUBLIC_API_BASE_URL` is set in Vercel
- [ ] `NEXT_PUBLIC_API_BASE_URL` has no trailing slash
- [ ] `NEXT_PUBLIC_API_BASE_URL` uses `https://` (not `http://`)
- [ ] Vercel app has been redeployed after setting environment variable
- [ ] `CORS_ALLOWED_ORIGINS` is set in Railway
- [ ] `CORS_ALLOWED_ORIGINS` includes your exact Vercel URL
- [ ] Railway service has been restarted after setting CORS
- [ ] `DJANGO_SETTINGS_MODULE=taskero_backend.settings_production` in Railway

---

## Test Commands

### Test Backend Accessibility
```bash
curl https://todo-next-production.up.railway.app/api/
```

### Test CORS
```bash
curl -H "Origin: https://your-vercel-app.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://todo-next-production.up.railway.app/api/auth/signin/ \
     -v
```

Look for `Access-Control-Allow-Origin: https://your-vercel-app.vercel.app` in response.

### Test API Endpoint
```bash
curl -X POST https://todo-next-production.up.railway.app/api/auth/signin/ \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123"}'
```

---

## Common Error Messages

### "Failed to fetch"
- **Cause:** Network error, backend not reachable, or CORS issue
- **Fix:** Check Railway backend is running, verify CORS settings

### "CORS policy: No 'Access-Control-Allow-Origin' header"
- **Cause:** CORS not configured in Railway
- **Fix:** Set `CORS_ALLOWED_ORIGINS` in Railway with your Vercel URL

### "NetworkError when attempting to fetch resource"
- **Cause:** Backend URL is wrong or backend is down
- **Fix:** Verify `NEXT_PUBLIC_API_BASE_URL` is correct, check Railway logs

### "Mixed Content" error
- **Cause:** Vercel uses HTTPS but trying to connect to HTTP backend
- **Fix:** Ensure Railway backend URL uses `https://` (Railway provides HTTPS by default)

---

## Still Not Working?

1. **Check Railway Logs:**
   - Railway Dashboard → Service → Logs
   - Look for errors or CORS-related messages

2. **Check Vercel Build Logs:**
   - Vercel Dashboard → Deployments → Latest → Build Logs
   - Verify environment variables are available during build

3. **Check Browser Console:**
   - Open DevTools → Console
   - Look for specific error messages
   - Check Network tab for failed requests

4. **Verify Environment Variables:**
   - In Vercel, check that `NEXT_PUBLIC_API_BASE_URL` is set for the correct environment
   - Make sure it's set for Production (not just Preview)

5. **Test Locally:**
   - Set `NEXT_PUBLIC_API_BASE_URL=https://todo-next-production.up.railway.app` in local `.env.local`
   - Run `npm run dev`
   - Test if it works locally (helps isolate if it's a Vercel-specific issue)

---

## Quick Reference

### Vercel Environment Variable
```
NEXT_PUBLIC_API_BASE_URL=https://todo-next-production.up.railway.app
```

### Railway Environment Variables
```
DJANGO_SETTINGS_MODULE=taskero_backend.settings_production
CORS_ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:3000
```

### Test URLs
- Backend: `https://todo-next-production.up.railway.app/api/`
- Frontend: `https://your-vercel-app.vercel.app`
- Admin: `https://todo-next-production.up.railway.app/admin`

---

## Need More Help?

- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide
- Check [VERCEL_RAILWAY_SETUP.md](./VERCEL_RAILWAY_SETUP.md) for setup instructions
- Railway Documentation: https://docs.railway.app
- Vercel Documentation: https://vercel.com/docs
