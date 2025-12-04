# Vercel Frontend Setup Guide

This guide will help you deploy the Next.js frontend to Vercel and connect it to your Render backend.

## Prerequisites

- ✅ Backend deployed on Render (see `RENDER_DEPLOYMENT.md`)
- ✅ GitHub repository with your code
- ✅ Vercel account (free tier available)

## Step 1: Deploy Frontend to Vercel

### Option A: Using Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with your GitHub account

2. **Import Your Repository**
   - Click **"Add New..."** → **"Project"**
   - Select your GitHub repository
   - Click **"Import"**

3. **Configure Project Settings**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `client` (important!)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm ci` (default)

4. **Set Environment Variables**
   - Before deploying, click **"Environment Variables"**
   - Add the following:
     ```
     NEXT_PUBLIC_API_BASE_URL=https://taskero-backend.onrender.com
     ```
   - **Important**: Replace `taskero-backend` with your actual Render service name
   - Apply to: **Production**, **Preview**, and **Development**

5. **Deploy**
   - Click **"Deploy"**
   - Wait for deployment to complete
   - Note your Vercel app URL (e.g., `https://your-app.vercel.app`)

### Option B: Using Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Navigate to Client Directory**
   ```bash
   cd client
   ```

4. **Deploy**
   ```bash
   vercel
   ```

5. **Set Environment Variable**
   ```bash
   vercel env add NEXT_PUBLIC_API_BASE_URL
   # Enter: https://taskero-backend.onrender.com
   # Select: Production, Preview, Development
   ```

## Step 2: Update Backend CORS Configuration

After deploying to Vercel, you need to update your Render backend to allow requests from your Vercel domain.

### Get Your Vercel URL

Your Vercel app will have URLs like:
- Production: `https://your-app.vercel.app`
- Preview: `https://your-app-git-branch-username.vercel.app`

### Update Render Environment Variables

1. **Go to Render Dashboard**
   - Navigate to your `taskero-backend` service
   - Click on **Environment** tab

2. **Update CORS_ALLOWED_ORIGINS**
   - Find `CORS_ALLOWED_ORIGINS` variable
   - Update it to include your Vercel URLs:
     ```
     https://your-app.vercel.app,https://your-app-git-main-username.vercel.app,http://localhost:3000
     ```
   - **Important**:
     - Include your production URL
     - Include preview URLs if you want to test branches
     - Keep `http://localhost:3000` for local development
     - Use commas to separate multiple URLs
     - No spaces after commas

3. **Save and Restart**
   - Click **"Save Changes"**
   - Render will automatically restart your service

### Alternative: Update render.yaml

If you're using `render.yaml`, update the `CORS_ALLOWED_ORIGINS` value:

```yaml
envVars:
  - key: CORS_ALLOWED_ORIGINS
    value: https://your-app.vercel.app,https://your-app-git-main-username.vercel.app,http://localhost:3000
```

Then push to GitHub and Render will update automatically.

## Step 3: Verify Connection

### Test Backend Health

1. **Check Backend is Running**
   ```bash
   curl https://taskero-backend.onrender.com/api/
   ```
   Should return a response (even if it's an error, it means backend is up)

### Test Frontend Connection

1. **Open Your Vercel App**
   - Visit your Vercel URL: `https://your-app.vercel.app`

2. **Open Browser DevTools**
   - Press `F12` or right-click → **Inspect**
   - Go to **Network** tab
   - Try to sign up or sign in

3. **Check for Errors**
   - Look for CORS errors in the console
   - Check Network tab for failed requests
   - Verify API calls are going to your Render backend

### Common Issues

#### CORS Error: "Access to fetch blocked by CORS policy"

**Solution:**
- Verify `CORS_ALLOWED_ORIGINS` in Render includes your exact Vercel URL
- Make sure URL includes `https://` protocol
- No trailing slashes in the URL
- Restart Render service after updating environment variables

#### 401 Unauthorized

**Solution:**
- Check that API requests include Authorization headers
- Verify JWT tokens are being stored correctly
- Check browser console for token storage issues

#### 502 Bad Gateway

**Solution:**
- Check Render service logs for errors
- Verify `DATABASE_URL` is correctly set
- Ensure migrations ran successfully

#### API Calls Going to localhost:8000

**Solution:**
- Verify `NEXT_PUBLIC_API_BASE_URL` is set in Vercel environment variables
- Make sure it's set for Production, Preview, and Development
- Redeploy after adding environment variables

## Step 4: Environment Variables Summary

### Vercel (Frontend)

```
NEXT_PUBLIC_API_BASE_URL=https://taskero-backend.onrender.com
```

**Where to set:**
- Vercel Dashboard → Your Project → Settings → Environment Variables

**Apply to:**
- ✅ Production
- ✅ Preview
- ✅ Development

### Render (Backend)

```
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-app-git-main-username.vercel.app,http://localhost:3000
```

**Where to set:**
- Render Dashboard → Your Service → Environment tab

## Step 5: Testing the Full Stack

1. **Sign Up**
   - Go to your Vercel app
   - Click "Sign Up"
   - Create a new account
   - Should redirect to dashboard on success

2. **Sign In**
   - Use your credentials to sign in
   - Should receive JWT tokens
   - Should redirect to dashboard

3. **Create a Task**
   - Navigate to dashboard
   - Create a new task
   - Should save to backend database

4. **Check Backend Logs**
   - Go to Render Dashboard → Logs
   - Verify API requests are being received
   - Check for any errors

## Step 6: Production Checklist

- [ ] Frontend deployed to Vercel
- [ ] `NEXT_PUBLIC_API_BASE_URL` set in Vercel environment variables
- [ ] Backend CORS includes Vercel production URL
- [ ] Backend CORS includes Vercel preview URLs (if needed)
- [ ] Test signup functionality
- [ ] Test signin functionality
- [ ] Test API calls from frontend
- [ ] Verify no CORS errors in browser console
- [ ] Check Render logs for successful API requests
- [ ] Test on mobile device (if applicable)

## Troubleshooting

### Frontend Not Connecting to Backend

1. **Check Environment Variable**
   ```bash
   # In browser console
   console.log(process.env.NEXT_PUBLIC_API_BASE_URL)
   ```
   Should show your Render URL, not `localhost:8000`

2. **Verify API Calls**
   - Open Network tab in DevTools
   - Check request URLs
   - Should start with your Render URL

3. **Check CORS Headers**
   - In Network tab, click on a failed request
   - Check Response Headers
   - Look for `Access-Control-Allow-Origin` header

### Backend Not Receiving Requests

1. **Check Render Logs**
   - Go to Render Dashboard → Logs
   - Look for incoming requests
   - Check for errors

2. **Test Backend Directly**
   ```bash
   curl https://taskero-backend.onrender.com/api/auth/signin/ \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"username":"test","password":"test"}'
   ```

3. **Verify Service is Running**
   - Check Render Dashboard
   - Service should show "Live" status

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Render Docs**: https://render.com/docs
- **Django CORS**: https://github.com/adamchainz/django-cors-headers
