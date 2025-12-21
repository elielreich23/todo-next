# Setup and Development Guide

This guide covers everything you need to set up, develop, and troubleshoot the Taskero application locally.

---

## Table of Contents

- [Local Setup](#local-setup)
- [Pre-commit Hooks](#pre-commit-hooks)
- [Session Management](#session-management)
- [Feature Roadmap](#feature-roadmap)
- [Troubleshooting](#troubleshooting)

---

## Local Setup

### Backend Setup

#### Option 1: Automated Setup (Recommended)

```powershell
cd backend
.\setup_local.ps1
```

#### Option 2: Manual Setup

```powershell
# 1. Navigate to backend directory
cd backend

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
.\venv\Scripts\Activate.ps1

# 4. Upgrade pip
python -m pip install --upgrade pip

# 5. Install dependencies
pip install -r requirements.txt

# 6. Run migrations
python manage.py migrate

# 7. Create superuser (optional)
python manage.py createsuperuser
```

### Running the Backend Server

#### Option 1: Use Start Script (Recommended)
```powershell
cd backend
.\start_server.ps1
```

#### Option 2: Manual Start
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python manage.py runserver
```

The server will start at: **http://localhost:8000**

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

The frontend will start at: **http://localhost:3000**

### Important Notes

1. **Always activate the virtual environment** before running Django commands
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

---

## Pre-commit Hooks

### Installation

```bash
pre-commit install
```

### Configuration

The project uses pre-commit hooks for code quality:
- **trailing-whitespace**: Removes trailing whitespace
- **end-of-file-fixer**: Ensures files end with newline
- **black**: Python code formatter
- **isort**: Python import sorter
- **flake8**: Python linter
- **bandit**: Security linter

### Running Hooks Manually

```bash
# Run on all files
pre-commit run --all-files

# Run specific hook
pre-commit run flake8 --all-files
```

### Common Issues

1. **ESLint Hook**: Temporarily disabled due to Next.js Babel configuration issues
2. **Django Check**: May fail on Windows if Python is not in PATH (expected, hook skips gracefully)
3. **Bandit**: Configured to skip B101 (assert_used) warnings

---

## Session Management

### Overview

The session management system provides:
- **User Isolation**: Each user only sees their own tasks and projects
- **Session Persistence**: User sessions persist across browser refreshes
- **Automatic Logout**: Sessions are cleared when users log out or tokens expire
- **Security**: Proper token validation and refresh handling

### Architecture

#### Backend (Django)
- **Models**: `Project` and `Task` models have `owner` foreign keys linking to authenticated user
- **Views**: All API endpoints filter data by `owner=request.user`
- **Authentication**: JWT token-based authentication with refresh tokens

#### Frontend (Next.js)

**Components:**
1. **UserContext** (`/src/contexts/UserContext.tsx`) - Manages authentication state
2. **ProjectsContext** (`/src/contexts/ProjectsContext.tsx`) - Manages projects and tasks data
3. **API Client** (`/src/lib/api.ts`) - Handles authentication headers and token refresh
4. **Session Hook** (`/src/hooks/useSession.ts`) - Provides session state management
5. **Session Manager** (`/src/utils/sessionManager.ts`) - Utility class for session operations

### Key Features

- **Automatic Token Refresh**: Tokens are automatically refreshed before expiration
- **Session Validation**: Sessions are validated on app load
- **Data Isolation**: Each user's data is completely isolated
- **Logout Handling**: Proper cleanup on logout

---

## Feature Roadmap

### ✅ Implemented Features

- JWT Authentication (login, register, token refresh)
- Project Management (CRUD operations)
- Task Management (CRUD operations)
- Task Assignment (multiple assignees per task)
- Basic Notifications (task assignment notifications)
- Calendar View (FullCalendar integration)
- Dashboard with Kanban board
- User Profiles
- Settings Page
- Theme Support (light/dark mode)
- Responsive Design
- Session Management

### ⚠️ Partially Implemented

- **File Attachments**: UI exists in frontend but not persisted to backend
- **Task Comments**: UI exists in frontend but not persisted to backend
- **Statistics Page**: Page exists but is empty/placeholder
- **Uploads Page**: Standalone CSV upload page (not integrated with tasks)

### 🎯 High Priority Features

1. **Complete File Attachments**
   - Backend API for file uploads
   - File storage (S3 or local)
   - File preview/download

2. **Complete Task Comments**
   - Backend API for comments
   - Real-time updates
   - Comment notifications

3. **Statistics Dashboard**
   - Task completion rates
   - Project progress tracking
   - User activity metrics

4. **Email Notifications**
   - Task assignment emails
   - Deadline reminders
   - Project updates

### 📋 Medium Priority Features

- Advanced filtering and search
- Task templates
- Recurring tasks
- Project templates
- Export functionality (PDF, CSV)
- Mobile app (React Native)

### 🔮 Future Enhancements

- Real-time collaboration
- Video conferencing integration
- AI-powered task suggestions
- Integration with external tools (Slack, GitHub, etc.)

---

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

### Database Issues

**Reset Database:**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python clear_db.py
python manage.py migrate
```

**Create Admin User:**
```powershell
python create_admin.py
```

### Frontend Build Issues

**Clear node_modules and reinstall:**
```bash
cd client
rm -rf node_modules package-lock.json
npm install
```

**Clear Next.js cache:**
```bash
rm -rf .next
npm run dev
```

### CORS Errors

If you see CORS errors during development:
1. Check `backend/taskero_backend/settings.py` includes `http://localhost:3000` in `CORS_ALLOWED_ORIGINS`
2. Restart the Django server after making changes

### Token Refresh Issues

If tokens aren't refreshing:
1. Check browser console for errors
2. Verify `REFRESH_TOKEN` is stored in localStorage
3. Check API endpoint `/api/token/refresh/` is accessible

---

## Quick Reference

### Backend Commands

| Command | Description |
|---------|-------------|
| `.\setup_local.ps1` | Initial setup (one-time) |
| `.\start_server.ps1` | Start the development server |
| `.\venv\Scripts\Activate.ps1` | Activate virtual environment |
| `python manage.py runserver` | Start server manually |
| `python manage.py migrate` | Apply database migrations |
| `python manage.py createsuperuser` | Create admin user |
| `python manage.py makemigrations` | Create migration files |

### Frontend Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run linter |
| `npm run type-check` | Run TypeScript type checking |

---

## Additional Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Django REST Framework](https://www.django-rest-framework.org/)
