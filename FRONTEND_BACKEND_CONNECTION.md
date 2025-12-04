# Frontend-Backend Connection Setup

Quick reference guide for connecting Vercel frontend to Render backend.

## Quick Setup (5 Minutes)

### 1. Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repository
3. Set **Root Directory** to: `client`
4. Add environment variable:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://taskero-backend.onrender.com
   ```
   (Replace `taskero-backend` with your Render service name)
5. Click **Deploy**

### 2. Update Backend CORS

1. Go to Render Dashboard → Your Service → **Environment** tab
2. Update `CORS_ALLOWED_ORIGINS`:
   ```
   https://your-app.vercel.app,http://localhost:3000
   ```
   (Replace `your-app` with your Vercel app name)
3. Click **Save Changes**

### 3. Test Connection

1. Open your Vercel app URL
2. Try to sign up or sign in
3. Check browser console for errors
4. Check Render logs for API requests

## Configuration Files

### Frontend (Vercel)

**Environment Variable:**
```
NEXT_PUBLIC_API_BASE_URL=https://taskero-backend.onrender.com
```

**Location:** Vercel Dashboard → Project → Settings → Environment Variables

**Code Reference:**
- `client/src/constants/index.ts` - Uses `process.env.NEXT_PUBLIC_API_BASE_URL`
- `client/src/lib/api.ts` - Makes API calls using `API_BASE_URL`

### Backend (Render)

**Environment Variable:**
```
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:3000
```

**Location:** Render Dashboard → Service → Environment tab

**Code Reference:**
- `backend/taskero_backend/settings_production.py` - CORS configuration

## Common URLs

### Development
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

### Production
- Frontend: `https://your-app.vercel.app`
- Backend: `https://taskero-backend.onrender.com`

## Troubleshooting

### CORS Error
- ✅ Verify `CORS_ALLOWED_ORIGINS` includes exact Vercel URL
- ✅ Include `https://` protocol
- ✅ No trailing slashes
- ✅ Restart Render service after changes

### API Calls Fail
- ✅ Check `NEXT_PUBLIC_API_BASE_URL` is set in Vercel
- ✅ Verify backend is running (check Render logs)
- ✅ Check browser Network tab for request details

### 401 Unauthorized
- ✅ Verify JWT tokens are being sent
- ✅ Check Authorization header in Network tab
- ✅ Verify token refresh is working

## Full Documentation

- **Vercel Setup**: See `VERCEL_SETUP.md`
- **Render Setup**: See `RENDER_DEPLOYMENT.md`
- **Module Error Fix**: See `RENDER_FIX_MODULE_ERROR.md`
