# Running Backend Locally - Quick Guide

## Initial Setup (One-Time)

### Option 1: Automated Setup (Recommended)
```powershell
cd C:\Users\eliel\Documents\GitHub\todo-next\backend
.\setup_local.ps1
```

### Option 2: Manual Setup
```powershell
# 1. Navigate to backend directory
cd C:\Users\eliel\Documents\GitHub\todo-next\backend

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
.\venv\Scripts\Activate.ps1

# 4. Upgrade pip
python -m pip install --upgrade pip

# 5. Install dependencies (skip psycopg2-binary for local SQLite)
pip install Django==5.1.4 djangorestframework==3.15.2 djangorestframework-simplejwt==5.3.1 django-cors-headers==4.4.0 setuptools python-decouple dj-database-url==2.1.0 whitenoise==6.6.0

# 6. Run migrations
python manage.py migrate
```

## Running the Server

### Option 1: Use the Start Script (Recommended)
```powershell
cd C:\Users\eliel\Documents\GitHub\todo-next\backend
.\start_server.ps1
```

### Option 2: Manual Start
```powershell
cd C:\Users\eliel\Documents\GitHub\todo-next\backend
.\venv\Scripts\Activate.ps1
python manage.py runserver
```

The server will start at: **http://localhost:8000**

## Important Notes

1. **Always activate the virtual environment** before running any Django commands
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```

2. **If you see "ModuleNotFoundError: No module named 'django'"**:
   - Make sure the virtual environment is activated (you should see `(venv)` in your prompt)
   - If not activated, run: `.\venv\Scripts\Activate.ps1`

3. **psycopg2-binary** is not installed (not needed for local SQLite development)
   - Only needed for PostgreSQL (production)
   - Local development uses SQLite (`db.sqlite3`)

4. **Running Migrations** (when models change):
   ```powershell
   .\venv\Scripts\Activate.ps1
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Creating a Superuser** (optional):
   ```powershell
   .\venv\Scripts\Activate.ps1
   python manage.py createsuperuser
   ```

## Troubleshooting

### Virtual Environment Not Activating
If you get an execution policy error:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Port Already in Use
If port 8000 is busy:
```powershell
python manage.py runserver 8001
```

### Module Not Found After Installation
1. Deactivate and reactivate the virtual environment
2. Make sure you're in the correct directory
3. Verify installation: `pip list | findstr Django`

## Quick Reference

| Command | Description |
|---------|-------------|
| `.\setup_local.ps1` | Initial setup (one-time) |
| `.\start_server.ps1` | Start the development server |
| `.\venv\Scripts\Activate.ps1` | Activate virtual environment |
| `python manage.py runserver` | Start server manually |
| `python manage.py migrate` | Apply database migrations |
| `python manage.py createsuperuser` | Create admin user |
