# Quick Setup: Railway Backend + Vercel Frontend

## 🚀 Quick Checklist

### Backend (Railway)

- [ ] Get your Railway backend URL: `https://your-app.up.railway.app`
- [ ] Set environment variable in Railway:
  ```
  CORS_ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:3000
  ```
- [ ] Verify `ALLOWED_HOSTS` includes your Railway domain
- [ ] Restart Railway service after updating environment variables

### Frontend (Vercel)

- [ ] Go to Vercel project → Settings → Environment Variables
- [ ] Add environment variable:
  - **Name:** `NEXT_PUBLIC_API_BASE_URL`
  - **Value:** `https://your-app.up.railway.app` (your Railway URL)
  - **Environment:** All (Production, Preview, Development)
- [ ] Redeploy Vercel after adding environment variable

### Test

- [ ] Open your Vercel app
- [ ] Open browser DevTools → Network tab
- [ ] Try to sign in
- [ ] Verify requests go to Railway backend
- [ ] Check for CORS errors (should be none)

## 📝 Environment Variables

### Railway
```
CORS_ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:3000
```

### Vercel
```
NEXT_PUBLIC_API_BASE_URL=https://your-app.up.railway.app
```

## 🔧 Common Issues

**CORS Error?**
- Check Railway `CORS_ALLOWED_ORIGINS` includes exact Vercel URL
- Make sure URL has `https://` (not `http://`)
- Restart Railway service

**401 Unauthorized?**
- Check Authorization headers are being sent
- Verify JWT tokens are stored correctly

**502 Bad Gateway?**
- Check Railway service is running
- Verify Railway logs for errors
- Check database connection

## 📚 Full Documentation

See `VERCEL_RAILWAY_SETUP.md` for detailed instructions.
