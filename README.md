# 📋 Taskero - Modern Task Management Application

🚀 **A comprehensive full-stack task management application built with Next.js frontend and Django REST Framework backend.** Manage projects, tasks, and collaborate efficiently with this modern, responsive, and feature-rich application.

---

## 📑 Table of Contents

- [Key Features](#-key-features)
- [Architecture Overview](#️-architecture-overview)
- [Technologies Used](#-technologies-used)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#️-database-schema)
- [Development](#-development)
- [Docker Deployment](#-docker-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Deployment Guide](#-deployment-guide)
- [Session Management](#-session-management)
- [Production Checklist](#-production-checklist)
- [Feature Roadmap](#-feature-roadmap)
- [Contributing](#-contributing)
- [Support](#-support)

---

## 🛠️ Key Features

- **🔐 Authentication System**: Secure user registration and login with JWT tokens
- **📁 Project Management**: Create, organize, and manage multiple projects with color coding
- **✅ Task Management**: Full CRUD operations for tasks with priority levels and status tracking
- **👥 Task Assignment**: Assign tasks to multiple team members
- **📅 Calendar Integration**: Built-in calendar view using FullCalendar
- **📊 Dashboard**: Comprehensive dashboard with statistics and project overview
- **👤 User Profiles**: User profile management and settings
- **📱 Responsive Design**: Modern UI that works seamlessly across all devices
- **🎨 Theme Support**: Light/dark theme toggle functionality
- **🔒 Session Management**: Secure user session handling with automatic token refresh
- **📈 Statistics**: Track productivity with detailed statistics
- **🐳 Docker Support**: Easy deployment with Docker containers

---

## 🏗️ Architecture Overview

This project uses a **monorepo structure** with separate frontend and backend implementations:

```
todo-next/
├── client/          # Next.js Frontend Application
├── backend/         # Django REST Framework Backend
│   ├── accounts/    # User authentication and management
│   ├── projects/    # Project and task management
│   └── taskero_backend/  # Django project settings
├── docker-compose.yml  # Docker deployment configuration
└── README.md
```

---

## 🚀 Technologies Used

### Frontend (Client)
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Sass/SCSS** - CSS preprocessing
- **FullCalendar** - Calendar component integration
- **UUID** - Unique identifier generation

### Backend (Django)
- **Django 5.1.4** - High-level Python web framework
- **Django REST Framework** - Powerful API framework
- **Django REST Framework SimpleJWT** - JWT authentication
- **Django CORS Headers** - Cross-origin resource sharing
- **SQLite** - Database (easily configurable for PostgreSQL/MySQL)
- **Custom User Model** - Extended user model with email authentication

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher) - for Django backend
- **npm** or **yarn** package manager
- **Docker** (optional) - for containerized deployment

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/elielreich23/todo-next.git
   cd todo-next
   ```

2. **Install Frontend Dependencies**:
   ```bash
   cd client
   npm install
   ```

3. **Setup Django Backend**:
   ```bash
   cd ../backend
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py createsuperuser  # Optional: Create admin user
   ```

### Running the Application

#### Option 1: Development Mode (Recommended for Development)

**Start the Frontend:**
```bash
cd client
npm run dev
```
The frontend will be available at `http://localhost:3000`

**Start the Backend:**
```bash
cd backend
python manage.py runserver
```
Backend API will be available at `http://localhost:8000`

#### Option 2: Docker Deployment (Recommended for Production)

**Build and run all services:**
```bash
docker compose up --build
```

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Django Admin: http://localhost:8000/admin (if superuser created)

### Database Setup

The application uses SQLite by default. For production, you can configure PostgreSQL or MySQL by updating the `DATABASES` setting in `backend/taskero_backend/settings.py`.

**Create initial data (optional):**
```bash
cd backend
python setup_db.py  # Creates test users and sample data
```

---

## 📂 Project Structure

```
todo-next/
│
├── client/                          # Next.js Frontend
│   ├── src/
│   │   ├── app/                     # App Router pages
│   │   │   ├── auth/               # Authentication pages (signin, signup, forgetPwd)
│   │   │   ├── dashboard/          # Dashboard and main app
│   │   │   │   ├── calendar/       # Calendar view
│   │   │   │   ├── projects/       # Project management
│   │   │   │   ├── profile/        # User profile
│   │   │   │   ├── settings/       # User settings
│   │   │   │   ├── statistics/     # Analytics and stats
│   │   │   │   └── uploads/        # File uploads
│   │   │   └── landing/           # Landing page
│   │   ├── components/            # Reusable components
│   │   ├── contexts/               # React contexts (User, Projects)
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── lib/                    # API client and utilities
│   │   ├── styles/                # Global styles and themes
│   │   └── utils/                  # Utility functions
│   ├── public/                     # Static assets
│   ├── Dockerfile                  # Frontend Docker configuration
│   └── package.json
│
├── backend/                         # Django REST Framework Backend
│   ├── accounts/                   # User authentication app
│   ├── projects/                   # Project and task management app
│   ├── taskero_backend/           # Django project settings
│   ├── data/                      # Data directory for Docker
│   ├── manage.py                  # Django management script
│   ├── requirements.txt           # Python dependencies
│   └── Dockerfile                 # Backend Docker configuration
│
├── docker-compose.yml              # Docker services configuration
└── README.md                       # This file
```

---

## 🔌 API Endpoints

### Authentication (JWT-based)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register/` | POST | Register a new user |
| `/api/auth/login/` | POST | Authenticate user login |
| `/api/auth/refresh/` | POST | Refresh JWT token |
| `/api/auth/me/` | GET | Get current user info |

### Projects
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects/` | GET | Get all user projects |
| `/api/projects/` | POST | Create a new project |
| `/api/projects/{id}/` | GET | Get specific project |
| `/api/projects/{id}/` | PUT | Update project |
| `/api/projects/{id}/` | DELETE | Delete project |

### Tasks
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tasks/` | GET | Get all tasks for user |
| `/api/tasks/` | POST | Create a new task |
| `/api/tasks/{id}/` | GET | Get specific task |
| `/api/tasks/{id}/` | PUT | Update task |
| `/api/tasks/{id}/` | DELETE | Delete task |
| `/api/tasks/{id}/assign/` | POST | Assign task to users |

### Authentication Flow
All protected endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 🗄️ Database Schema

### Custom User Model (accounts.User)
- `id` - Primary key
- `username` - Unique username
- `email` - Unique email address (used for login)
- `password` - Hashed password
- `full_name` - User's full name
- `is_active` - Account status
- `date_joined` - Account creation timestamp
- `last_login` - Last login timestamp

### Projects Table (projects.Project)
- `id` - Primary key
- `name` - Project name
- `description` - Project description (optional)
- `color` - Hex color code for project identification
- `owner` - Foreign key to User (project owner)
- `created_at` - Project creation timestamp
- `updated_at` - Last update timestamp

### Tasks Table (projects.Task)
- `id` - Primary key
- `title` - Task title
- `description` - Task description (optional)
- `status` - Task status (todo, in_progress, completed)
- `priority` - Task priority (low, medium, high)
- `due_date` - Task deadline (optional)
- `completed_at` - Completion timestamp (auto-set)
- `project` - Foreign key to Project
- `owner` - Foreign key to User (task creator)
- `assignees` - Many-to-many relationship with User (task assignees)
- `created_at` - Task creation timestamp
- `updated_at` - Last update timestamp

---

## 🧪 Development

### Test Users
The Django backend includes a setup script to create test users for development:
```bash
cd backend
python setup_db.py
```

This creates test users with the following credentials:
- **Admin**: `admin@taskero.com` / `admin123`
- **User 1**: `user1@taskero.com` / `user123`
- **User 2**: `user2@taskero.com` / `user123`

### Django Admin Interface
Access the Django admin interface at `http://localhost:8000/admin/` to:
- Manage users, projects, and tasks
- View database records
- Monitor application activity

### Development Commands

#### Frontend
```bash
cd client
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

#### Backend
```bash
cd backend
python manage.py runserver     # Start development server
python manage.py test          # Run tests
python manage.py makemigrations # Create migrations
python manage.py migrate       # Apply migrations
python manage.py shell         # Django shell
```

---

## 🐳 Docker Deployment

### Quick Start

1. **Build and run all services:**
   ```bash
   docker compose up --build
   ```

2. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

### Services

#### Frontend (Next.js)
- **Port:** 3000
- **Container:** `todo-next_frontend_1`
- **Build:** Optimized production build
- **Environment:** Production mode

#### Backend (Django)
- **Port:** 8000
- **Container:** `todo-next_backend_1`
- **Database:** SQLite (persisted via volume)
- **Features:** Auto-migration on startup

### Docker Commands

```bash
# Start services
docker compose up

# Start in background
docker compose up -d

# Stop services
docker compose down

# Rebuild and start
docker compose up --build

# View logs
docker compose logs frontend
docker compose logs backend

# Access backend shell
docker compose exec backend bash

# Access frontend shell
docker compose exec frontend sh
```

### Data Persistence

- SQLite database is persisted in `./backend/data/` and `./backend/db.sqlite3`
- Existing data will be preserved when using Docker

### Troubleshooting

1. **Port conflicts:** Ensure ports 3000 and 8000 are available
2. **Database issues:** Check volume mounts in docker-compose.yml
3. **Build failures:** Check Dockerfile syntax and dependencies
4. **API connection:** Verify NEXT_PUBLIC_API_BASE_URL environment variable

---

## CI/CD Pipeline

### Overview

The project uses GitHub Actions for continuous integration and deployment. The pipeline includes:

- **CI Pipeline**: Automated testing, linting, and code quality checks
- **CD Pipeline**: Automated building and deployment of Docker images
- **PR Checks**: Code quality and security checks for pull requests
- **Nightly Tests**: Comprehensive test suite across multiple versions
- **Dependabot**: Automated dependency updates

### Quick Start (5-Minute Setup)

1. **Configure GitHub Secrets**
   Go to your repository → Settings → Secrets and variables → Actions → New repository secret

   Add these secrets:
   ```
   STAGING_URL=https://staging.yourdomain.com
   STAGING_API_URL=https://api-staging.yourdomain.com
   STAGING_DB_URL=postgresql://user:pass@host:5432/dbname
   PRODUCTION_URL=https://yourdomain.com
   PRODUCTION_API_URL=https://api.yourdomain.com
   PRODUCTION_DB_URL=postgresql://user:pass@host:5432/dbname
   NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
   ```

2. **Enable GitHub Actions**
   Workflows are automatically enabled. Check the Actions tab to see them run.

3. **Test Locally (Optional)**
   ```bash
   # Frontend
   cd client
   npm install
   npm run lint
   npm run build

   # Backend
   cd backend
   pip install -r requirements.txt
   pip install black flake8 isort pytest pytest-django
   make check  # or: black --check . && isort --check-only . && flake8 .
   ```

### Workflows

#### 1. CI Pipeline (`.github/workflows/ci.yml`)
Runs on every push and pull request to main/master/develop branches.

**Jobs:**
- **Frontend CI**: Linting, type checking, and building the Next.js application
- **Backend CI**: Code formatting, linting, Django checks, and tests
- **Docker Build Test**: Validates Docker images can be built
- **Security Scan**: Checks for vulnerabilities in dependencies

#### 2. CD Pipeline (`.github/workflows/cd.yml`)
Runs on pushes to main/master and version tags.

**Jobs:**
- **Build and Push**: Builds and pushes Docker images to GitHub Container Registry
- **Deploy to Staging**: Deploys to staging environment (develop branch)
- **Deploy to Production**: Deploys to production environment (main/master branch)
- **Notify**: Sends deployment notifications

#### 3. PR Checks (`.github/workflows/pr-checks.yml`)
Runs on pull request events.

**Checks:**
- Semantic PR title validation
- Large file detection
- Secret scanning
- Dependency review

#### 4. Nightly Tests (`.github/workflows/nightly-tests.yml`)
Runs daily at 2 AM UTC and can be manually triggered.

**Tests:**
- Full test suite across multiple Python versions (3.10, 3.11, 3.12)
- Full test suite across multiple Node.js versions (18, 20)

### Code Quality Tools

#### Frontend
- **ESLint**: Code linting (configured in `client/.eslintrc.json`)
- **TypeScript**: Type checking
- **Next.js**: Built-in linting and type checking

#### Backend
- **Black**: Code formatting (configured in `backend/pyproject.toml`)
- **isort**: Import sorting (configured in `backend/pyproject.toml`)
- **Flake8**: Code linting (configured in `backend/.flake8`)
- **Pytest**: Testing framework (configured in `backend/pytest.ini`)
- **Bandit**: Security linting (via pre-commit)

### Pre-commit Hooks

Install pre-commit hooks to run checks before committing:

```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install

# Run hooks manually
pre-commit run --all-files
```

### Troubleshooting CI/CD

**CI Pipeline Fails:**
1. **Linting errors**: Fix code style issues locally
2. **Test failures**: Run tests locally to debug
3. **Build failures**: Check Dockerfile and dependencies
4. **Timeout errors**: Increase timeout in workflow file

**CD Pipeline Fails:**
1. **Docker build fails**: Check Dockerfile syntax
2. **Deployment fails**: Verify secrets and deployment scripts
3. **Health checks fail**: Ensure services are running

**Common Issues:**
- **"Permission denied" errors**: Check GitHub Actions permissions in repository settings
- **"Secret not found" errors**: Ensure all required secrets are configured
- **"Docker build context" errors**: Verify Dockerfile paths are correct

For detailed CI/CD documentation, see the workflow files in `.github/workflows/`.

---

## 🚀 Deployment Guide

### Frontend Deployment on Vercel

#### Option A: Deploy via Vercel Dashboard (Recommended for First Time)

1. **Sign up/Login to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with your GitHub account

2. **Import Your Project**
   - Click "Add New..." → "Project"
   - Select your GitHub repository
   - Choose the repository: `todo-next`

3. **Configure Project Settings**
   - **Root Directory**: Set to `client` (click "Edit" next to Root Directory)
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm ci` (default)

4. **Environment Variables**
   - Click "Environment Variables"
   - Add: `NEXT_PUBLIC_API_BASE_URL` = `https://your-backend-url.com` (you'll update this after deploying backend)

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (usually 2-5 minutes)
   - Your app will be live at `https://your-project.vercel.app`

#### Option B: Deploy via Vercel CLI

```bash
npm i -g vercel
vercel login
cd client
vercel
vercel --prod
```

### Backend Deployment Options

#### Option 1: Railway (Recommended - Easy & Free Tier Available)

1. **Sign up for Railway**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure Service**
   - Railway will detect it's a Python project
   - **Root Directory**: Set to `backend`
   - **Start Command**: `python manage.py migrate && gunicorn taskero_backend.wsgi:application --bind 0.0.0.0:$PORT`

4. **Add PostgreSQL Database**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will automatically provide `DATABASE_URL` environment variable

5. **Set Environment Variables**
   - `SECRET_KEY`: Generate a secure key
   - `DEBUG`: `False`
   - `DJANGO_SETTINGS_MODULE`: `taskero_backend.settings`
   - `ALLOWED_HOSTS`: `your-app.railway.app,your-vercel-domain.vercel.app`
   - `CORS_ALLOWED_ORIGINS`: `https://your-vercel-domain.vercel.app`

6. **Deploy**
   - Railway will automatically deploy on push to main branch
   - Get your backend URL from the service settings

#### Option 2: Render (Free Tier Available)

Similar process to Railway. See `DEPLOYMENT_GUIDE.md` for detailed instructions.

#### Option 3: DigitalOcean App Platform

See `DEPLOYMENT_GUIDE.md` for detailed instructions.

### Post-Deployment

1. **Update Frontend Environment Variable**
   - Go back to Vercel
   - Update `NEXT_PUBLIC_API_BASE_URL` to your backend URL

2. **Update Backend CORS Settings**
   - Update `CORS_ALLOWED_ORIGINS` to include your Vercel domain

3. **Run Migrations**
   - Backend should auto-run migrations, but verify in deployment logs

4. **Create Admin User**
   - Access your backend shell and run:
   ```bash
   python manage.py createsuperuser
   ```

For complete deployment instructions, see `DEPLOYMENT_GUIDE.md` and `DEPLOYMENT_CHECKLIST.md`.

---

## 🔒 Session Management

The application implements comprehensive session management to ensure user data isolation and security.

### Key Features

- **User Isolation**: Each user only sees their own tasks and projects
- **Session Persistence**: User sessions persist across browser refreshes
- **Automatic Logout**: Sessions are cleared when users log out or tokens expire
- **Security**: Proper token validation and refresh handling

### Architecture

#### Backend (Django)
- Models filter data by `owner=request.user`
- JWT token-based authentication with refresh tokens
- All API endpoints require authentication

#### Frontend (Next.js)
- **UserContext**: Manages user authentication state
- **ProjectsContext**: Manages projects and tasks data, listens for logout events
- **API Client**: Handles authentication headers and token refresh
- **Session Manager**: Utility for session storage operations

### Session Flow

1. **Login**: User provides credentials → Backend validates → Returns JWT tokens → Frontend stores tokens
2. **API Requests**: Frontend includes Bearer token → Backend validates → Returns user-specific data
3. **Token Expiry**: API returns 401 → Frontend attempts refresh → If refresh fails → Logout
4. **Logout**: User clicks logout → All data cleared → Redirect to login page

### Security Considerations

1. **Token Storage**: Tokens are stored in localStorage
2. **Token Refresh**: Automatic refresh prevents session interruption
3. **Data Clearing**: All user data is cleared on logout
4. **Session Validation**: Regular validation ensures session integrity
5. **Error Handling**: Proper error handling prevents data leaks

For detailed session management documentation, see `SESSION_MANAGEMENT.md`.

---

## ✅ Production Checklist

### Frontend (Next.js)
- [ ] Environment variables set correctly
- [ ] API URL points to deployed backend
- [ ] Custom domain configured (if needed)
- [ ] SSL certificate active (automatic on Vercel)
- [ ] Remove hardcoded localhost URLs
- [ ] Error boundaries implemented
- [ ] Loading states for all API calls
- [ ] Console logs removed or disabled in production

### Backend (Django)
- [ ] Database migrations run
- [ ] Static files collected
- [ ] Environment variables configured
- [ ] CORS configured for frontend domain
- [ ] Admin user created
- [ ] Health check endpoint working
- [ ] DEBUG set to False
- [ ] SECRET_KEY is not default value
- [ ] Security headers configured
- [ ] Use PostgreSQL in production (not SQLite)

### Security
- [ ] DEBUG is False
- [ ] SECRET_KEY is not default value
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Environment variables not exposed in frontend
- [ ] Rate limiting on auth endpoints
- [ ] Input validation on all endpoints

### Monitoring
- [ ] Set up error tracking (optional: Sentry)
- [ ] Monitor deployment logs
- [ ] Check database connections
- [ ] Verify API response times

For a complete production checklist, see `PRODUCTION_CHECKLIST.md`.

---

## 🚧 Feature Roadmap

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

1. **Backend Persistence for Comments** ⭐⭐⭐
2. **Backend Persistence for File Attachments** ⭐⭐⭐
3. **Real-time Notifications with WebSockets** ⭐⭐⭐
4. **Project Sharing & Collaboration** ⭐⭐⭐
5. **Advanced Search & Filtering** ⭐⭐
6. **Task Labels/Tags System** ⭐⭐
7. **Task Dependencies** ⭐⭐
8. **Time Tracking** ⭐⭐
9. **Statistics & Analytics Dashboard** ⭐⭐
10. **Email Notifications** ⭐⭐

### 🔧 Medium Priority Features

- Calendar Integration with Tasks
- Recurring Tasks
- Subtasks/Checklists
- Task Templates
- Activity Log/Audit Trail
- Bulk Operations
- Export/Import Functionality
- Due Date Reminders

### 🌟 Advanced/Enterprise Features

- Advanced Permissions & Roles
- Multi-tenant/Organization Support
- Third-party Integrations (GitHub, Slack, Teams)
- AI-Powered Features
- Custom Fields & Workflows
- Mobile App (React Native)
- Advanced Reporting

For complete feature roadmap, see `FEATURE_ROADMAP.md`.

---

## 🤝 Contributing

We welcome contributions from the community! This project is open source and we appreciate any help you can provide.

### Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/todo-next.git
   cd todo-next
   ```
3. **Add the upstream repository**:
   ```bash
   git remote add upstream https://github.com/elielreich23/todo-next.git
   ```

### Development Setup

1. **Set up the development environment**:
   ```bash
   # Frontend setup
   cd client
   npm install

   # Backend setup
   cd ../backend
   pip install -r requirements.txt
   python manage.py migrate
   ```

2. **Create a new branch** for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

### Contribution Guidelines

#### Code Style
- **Frontend**: Follow ESLint configuration and use TypeScript
- **Backend**: Follow PEP 8 Python style guide
- **Commits**: Use conventional commit messages (e.g., `feat: add user authentication`)
- **Documentation**: Update README and add comments for complex logic

#### Pull Request Process

1. **Make your changes** following the code style guidelines
2. **Test your changes** thoroughly:
   ```bash
   # Frontend tests
   cd client
   npm run lint
   npm run build

   # Backend tests
   cd ../backend
   python manage.py test
   ```
3. **Update documentation** if needed
4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```
5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Create a Pull Request** on GitHub

### Types of Contributions

- 🐛 Bug Reports
- ✨ Feature Requests
- 📝 Documentation
- 🔧 Code Contributions

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🛠️ Developed by

- **Eliel Reich**
  GitHub: [@elielreich23](https://github.com/elielreich23)

- **Dimedji**
  GitHub: [@Oladee](https://github.com/Oladee)

---

## ✨ Designed By

- **Adeyemi**
  GitHub: [@elielreich23](https://github.com/elielreich23)

---

## 📞 Support

If you encounter any issues or have questions, please:
1. Check the [Issues](https://github.com/elielreich23/todo-next/issues) page
2. Create a new issue with detailed information
3. Contact the development team

---

*Built with ❤️ by the Taskero development team*
