# Troubleshooting Guide

## "Failed to fetch" Error on Signup

### Quick Fixes

1. **Restart the Django server** to apply CORS changes:
   ```bash
   cd backend
   python manage.py runserver
   ```

2. **Verify the backend is running** on port 8000:
   ```bash
   # Check if port 8000 is listening
   netstat -ano | findstr :8000
   ```

3. **Check the API URL** in your frontend:
   - Open browser DevTools (F12)
   - Check Console for the exact error
   - Verify `NEXT_PUBLIC_API_BASE_URL` is set to `http://localhost:8000`

4. **Verify CORS settings**:
   - Backend should have `CORS_ALLOW_ALL_ORIGINS = True` in DEBUG mode
   - Check `backend/taskero_backend/settings.py`

5. **Check browser console** for:
   - CORS errors
   - Network errors
   - The actual API URL being called

### Common Issues

#### Issue: Backend not running
**Solution**: Start the Django server:
```bash
cd backend
python manage.py runserver
```

#### Issue: Wrong API URL
**Solution**: Check your `.env` file or `next.config.mjs`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

#### Issue: CORS blocking requests
**Solution**: The CORS settings have been updated. Restart the Django server.

#### Issue: Port conflict
**Solution**: If port 8000 is in use, either:
- Stop the conflicting process
- Change Django port: `python manage.py runserver 8001`
- Update frontend API URL accordingly

### Testing the Backend Directly

Test if the backend is working:
```powershell
$body = @{username='test'; email='test@test.com'; full_name='Test'; password='Test1234!'; password_confirm='Test1234!'} | ConvertTo-Json
Invoke-WebRequest -Uri 'http://localhost:8000/api/auth/signup/' -Method POST -Body $body -ContentType 'application/json'
```

If this works, the issue is likely CORS or frontend configuration.
