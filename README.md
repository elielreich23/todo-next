# 📋 Taskero - Modern Task Management Application

🚀 **A comprehensive full-stack task management application built with Next.js frontend and Django REST Framework backend.** Manage projects, tasks, and collaborate efficiently with this modern, responsive, and feature-rich application.

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
- **Axios** - HTTP client for API requests

### Backend (Django)
- **Django 4.2.7** - High-level Python web framework
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
docker-compose up --build
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
│   │   │   ├── todo/              # Task-related components
│   │   │   ├── sideBar/           # Navigation sidebar
│   │   │   ├── ProjectWizard/     # Project creation wizard
│   │   │   └── WizardModal/       # Modal components
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
│   │   ├── models.py              # Custom User model
│   │   ├── views.py               # Authentication views
│   │   ├── serializers.py         # User serializers
│   │   └── urls.py                # Authentication URLs
│   ├── projects/                   # Project and task management app
│   │   ├── models.py              # Project and Task models
│   │   ├── views.py               # Project/Task views
│   │   ├── serializers.py         # Project/Task serializers
│   │   └── urls.py                # Project/Task URLs
│   ├── taskero_backend/           # Django project settings
│   │   ├── settings.py            # Django configuration
│   │   ├── urls.py                # Main URL configuration
│   │   └── wsgi.py                # WSGI configuration
│   ├── data/                      # Data directory for Docker
│   ├── manage.py                  # Django management script
│   ├── run.py                     # Custom server runner
│   ├── setup_db.py                # Database setup script
│   ├── db.sqlite3                 # SQLite database
│   ├── users.db                   # Additional database file
│   ├── requirements.txt           # Python dependencies
│   └── Dockerfile                 # Backend Docker configuration
│
├── docker-compose.yml              # Docker services configuration
├── README-Docker.md                # Docker-specific documentation
├── SESSION_MANAGEMENT.md           # Session management documentation
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

### Admin & Utility
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/` | GET | Django admin interface |
| `/api/` | GET | API root endpoint |
| `/api/setup-db/` | POST | Create test users (development) |

### Authentication Flow
All protected endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 🛡️ Authentication Flow

1. **User Registration**: 
   - Send POST request to `/api/auth/register/` with user details
   - Backend creates user account and returns JWT tokens (access + refresh)
   - Frontend stores tokens in localStorage

2. **User Login**: 
   - Send POST request to `/api/auth/login/` with credentials
   - Backend validates credentials and returns JWT tokens
   - Frontend stores tokens and redirects to dashboard

3. **Authenticated Requests**: 
   - Include JWT token in `Authorization: Bearer <access-token>` header
   - Backend validates token for protected routes
   - Automatic token refresh when access token expires

4. **Session Management**:
   - Tokens are automatically refreshed before expiry
   - User data is isolated per session
   - Logout clears all stored tokens and user data

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

## 🧪 Development Features

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

### Environment Configuration
The Django backend uses environment variables for configuration. Key settings in `backend/taskero_backend/settings.py`:
- `SECRET_KEY` - Django secret key
- `DEBUG` - Debug mode (True for development)
- `ALLOWED_HOSTS` - Allowed host names
- `CORS_ALLOWED_ORIGINS` - Frontend origins for CORS

---

## 🚧 Upcoming Features & Roadmap

### Phase 1: Core Enhancements (Q1 2024)
- **🔔 Real-time Notifications**: WebSocket integration for live updates
- **📁 File Attachments**: Upload and manage files within tasks
- **🏷️ Task Labels & Tags**: Categorize tasks with custom labels
- **📊 Advanced Analytics**: Detailed productivity metrics and reports
- **🔍 Search & Filtering**: Advanced search across projects and tasks

### Phase 2: Collaboration Features (Q2 2024)
- **👥 Team Collaboration**: Multi-user project sharing and permissions
- **💬 Task Comments**: Add comments and collaborate on tasks
- **📧 Email Notifications**: Email alerts for task assignments and updates
- **📅 Calendar Sync**: Integration with Google Calendar and Outlook
- **🔄 Task Dependencies**: Link tasks and create project workflows

### Phase 3: Advanced Features (Q3 2024)
- **📱 Mobile App**: React Native mobile application
- **🤖 AI-Powered Insights**: Smart task suggestions and productivity analysis
- **📈 Time Tracking**: Built-in time tracking for tasks
- **🎯 Goal Setting**: Set and track project goals and milestones
- **📋 Templates**: Pre-built project and task templates

### Phase 4: Enterprise Features (Q4 2024)
- **🏢 Multi-tenant Support**: Organization-level project management
- **🔐 Advanced Security**: SSO integration and advanced permissions
- **📊 Custom Dashboards**: Configurable analytics dashboards
- **🔗 Third-party Integrations**: Slack, Microsoft Teams, GitHub integration
- **☁️ Cloud Deployment**: Production-ready cloud hosting solutions

### Technical Improvements
- **🧪 Testing Suite**: Comprehensive unit and integration tests
- **📚 API Documentation**: Interactive API documentation with Swagger
- **🚀 Performance Optimization**: Database optimization and caching
- **🔒 Security Enhancements**: Rate limiting, input validation, and security headers
- **📦 CI/CD Pipeline**: Automated testing and deployment

---

## 🤝 Contributing

We welcome contributions from the community! This project is open source and we appreciate any help you can provide. Please read this guide before contributing.

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

#### Pull Request Template

When creating a PR, please include:

- **Description**: What changes were made and why
- **Type**: Feature, Bug Fix, Documentation, Refactoring, etc.
- **Testing**: How the changes were tested
- **Screenshots**: If applicable, include screenshots of UI changes
- **Breaking Changes**: List any breaking changes
- **Related Issues**: Link to any related issues

### Types of Contributions

#### 🐛 Bug Reports
- Use the GitHub issue template
- Include steps to reproduce the bug
- Provide expected vs actual behavior
- Include system information (OS, browser, etc.)

#### ✨ Feature Requests
- Use the GitHub issue template
- Describe the feature in detail
- Explain the use case and benefits
- Consider implementation complexity

#### 📝 Documentation
- Fix typos and improve clarity
- Add examples and code snippets
- Update API documentation
- Improve setup instructions

#### 🔧 Code Contributions
- Bug fixes
- New features
- Performance improvements
- Code refactoring
- Test coverage improvements

### Development Workflow

#### Frontend Development
```bash
cd client
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

#### Backend Development
```bash
cd backend
python manage.py runserver     # Start development server
python manage.py test          # Run tests
python manage.py makemigrations # Create migrations
python manage.py migrate       # Apply migrations
python manage.py shell         # Django shell
```

#### Docker Development
```bash
docker-compose up --build      # Build and run containers
docker-compose down            # Stop containers
docker-compose logs backend    # View backend logs
docker-compose logs frontend   # View frontend logs
```

### Code Review Process

1. **Automated Checks**: All PRs must pass automated tests and linting
2. **Code Review**: At least one maintainer will review your code
3. **Feedback**: Address any feedback or requested changes
4. **Approval**: Once approved, your PR will be merged

### Issue Labels

We use the following labels to categorize issues:
- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements or additions to documentation
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed
- `priority: high` - High priority issues
- `priority: low` - Low priority issues

### Community Guidelines

- Be respectful and inclusive
- Help others learn and grow
- Provide constructive feedback
- Follow the code of conduct
- Ask questions if you're unsure

### Getting Help

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and general discussion
- **Email**: Contact the maintainers directly for sensitive issues

### Recognition

Contributors will be recognized in:
- README contributors section
- Release notes
- Project documentation

Thank you for contributing to Taskero! 🎉

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