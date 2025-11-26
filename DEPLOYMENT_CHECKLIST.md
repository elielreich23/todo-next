# Deployment Checklist

Use this checklist to ensure a smooth deployment process.

## Pre-Deployment

### Frontend (Next.js)
- [ ] All environment variables documented
- [ ] `next.config.mjs` configured correctly
- [ ] `vercel.json` created (optional)
- [ ] Build passes locally: `npm run build`
- [ ] Linting passes: `npm run lint`
- [ ] Type checking passes: `npm run type-check`

### Backend (Django)
- [ ] `requirements.txt` or `requirements-production.txt` updated
- [ ] `Procfile` created for platform deployment
- [ ] Production settings configured
- [ ] Database migrations ready
- [ ] Static files configuration set up
- [ ] CORS settings configured for frontend domain
- [ ] Secret key generated (not using default)
- [ ] DEBUG set to False for production

## Deployment Steps

### Step 1: Deploy Backend First
- [ ] Choose deployment platform (Railway, Render, etc.)
- [ ] Create account and project
- [ ] Connect GitHub repository
- [ ] Set root directory to `backend`
- [ ] Configure environment variables:
  - [ ] `SECRET_KEY`
  - [ ] `DEBUG=False`
  - [ ] `DATABASE_URL` (if using PostgreSQL)
  - [ ] `ALLOWED_HOSTS`
  - [ ] `CORS_ALLOWED_ORIGINS`
- [ ] Add PostgreSQL database (if needed)
- [ ] Deploy and verify backend URL
- [ ] Test backend endpoints
- [ ] Create admin user

### Step 2: Deploy Frontend
- [ ] Sign up/login to Vercel
- [ ] Import GitHub repository
- [ ] Set root directory to `client`
- [ ] Configure environment variables:
  - [ ] `NEXT_PUBLIC_API_BASE_URL` = your backend URL
- [ ] Deploy
- [ ] Verify frontend URL

### Step 3: Connect Frontend to Backend
- [ ] Update `NEXT_PUBLIC_API_BASE_URL` in Vercel to point to backend
- [ ] Update `CORS_ALLOWED_ORIGINS` in backend to include Vercel domain
- [ ] Redeploy both if needed

## Post-Deployment

### Testing
- [ ] Frontend loads correctly
- [ ] Can sign up new user
- [ ] Can sign in
- [ ] API calls work (check browser console)
- [ ] No CORS errors
- [ ] Database operations work
- [ ] File uploads work (if applicable)
- [ ] Static files load correctly

### Security
- [ ] DEBUG is False
- [ ] SECRET_KEY is not default value
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] CORS properly configured
- [ ] Environment variables not exposed in frontend

### Monitoring
- [ ] Set up error tracking (optional)
- [ ] Monitor deployment logs
- [ ] Check database connections
- [ ] Verify API response times

## Troubleshooting

### Common Issues
- **CORS Errors**: Check `CORS_ALLOWED_ORIGINS` includes frontend URL
- **404 on API calls**: Verify `NEXT_PUBLIC_API_BASE_URL` is correct
- **Database errors**: Check `DATABASE_URL` and migrations
- **Build failures**: Check deployment logs for specific errors
- **Static files not loading**: Run `collectstatic` and check WhiteNoise config

## Quick Commands

### Generate Django Secret Key
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### Run Migrations Locally
```bash
cd backend
python manage.py migrate
```

### Collect Static Files
```bash
cd backend
python manage.py collectstatic --noinput
```

### Test Backend Locally
```bash
cd backend
python manage.py runserver
```

### Test Frontend Locally
```bash
cd client
npm run dev
```
