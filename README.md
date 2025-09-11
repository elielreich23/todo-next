# 📋 Taskero - Modern Task Management Application

🚀 **A comprehensive full-stack task management application built with Next.js frontend and dual backend options (FastAPI Python & Express.js Node.js).** Manage projects, tasks, and collaborate efficiently with this modern, responsive, and feature-rich application.

---

## 🛠️ Key Features

- **🔐 Authentication System**: Secure user registration and login with JWT tokens
- **📁 Project Management**: Create, organize, and manage multiple projects
- **✅ Task Management**: Full CRUD operations for tasks with status tracking
- **📅 Calendar Integration**: Built-in calendar view using FullCalendar
- **📊 Dashboard**: Comprehensive dashboard with statistics and project overview
- **👤 User Profiles**: User profile management and settings
- **📱 Responsive Design**: Modern UI that works seamlessly across all devices
- **🎨 Theme Support**: Light/dark theme toggle functionality
- **💬 Task Comments**: Add comments and collaborate on tasks
- **📈 Statistics**: Track productivity with detailed statistics

---

## 🏗️ Architecture Overview

This project uses a **monorepo structure** with separate frontend and backend implementations:

```
todo-next/
├── client/          # Next.js Frontend Application
├── backend/         # Dual Backend Options
│   ├── Python/      # FastAPI Backend (Primary)
│   └── Node.js/     # Express.js Backend (Alternative)
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

### Backend Options

#### Option 1: Python FastAPI (Recommended)
- **FastAPI** - Modern, fast web framework
- **Uvicorn** - ASGI server
- **SQLAlchemy** - ORM for database operations
- **Pydantic** - Data validation
- **Passlib** - Password hashing with bcrypt
- **SQLite** - Database (easily configurable for PostgreSQL/MySQL)

#### Option 2: Node.js Express
- **Express.js** - Web framework
- **TypeScript** - Type-safe JavaScript
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logger

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher) - for FastAPI backend
- **npm** or **yarn** package manager

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

3. **Choose Your Backend Option**:

   #### Option A: FastAPI Backend (Recommended)
   ```bash
   cd ../backend
   pip install -r requirements.txt
   ```

   #### Option B: Express Backend
   ```bash
   cd backend
   npm install
   ```

### Running the Application

#### Start the Frontend
```bash
cd client
npm run dev
```
The frontend will be available at `http://localhost:3000`

#### Start the Backend

**For FastAPI Backend:**
```bash
cd backend
python run.py
# or
uvicorn main:app --host 0.0.0.0 --port 3001 --reload
```
Backend API will be available at `http://localhost:3001`

**For Express Backend:**
```bash
cd backend
npm run dev
```
Backend API will be available at `http://localhost:4000`

---

## 📂 Project Structure

```
todo-next/
│
├── client/                          # Next.js Frontend
│   ├── src/
│   │   ├── app/                     # App Router pages
│   │   │   ├── auth/               # Authentication pages
│   │   │   ├── dashboard/          # Dashboard and main app
│   │   │   ├── landing/           # Landing page
│   │   │   └── api/               # API routes (if needed)
│   │   ├── components/            # Reusable components
│   │   │   ├── todo/              # Task-related components
│   │   │   ├── sideBar/           # Navigation sidebar
│   │   │   └── ProjectWizard/     # Project creation wizard
│   │   ├── contexts/               # React contexts
│   │   ├── lib/                    # Utility functions
│   │   └── styles/                # Global styles
│   ├── public/                     # Static assets
│   └── package.json
│
├── backend/                         # Backend Services
│   ├── src/                        # Express.js TypeScript source
│   │   ├── routes/                # API route handlers
│   │   └── lib/                   # Database and utilities
│   ├── main.py                     # FastAPI application entry
│   ├── run.py                      # FastAPI server runner
│   ├── models.py                   # SQLAlchemy models
│   ├── schemas.py                  # Pydantic schemas
│   ├── auth.py                     # Authentication routes
│   ├── projects.py                 # Project management routes
│   ├── tasks.py                    # Task management routes
│   ├── database.py                 # Database configuration
│   ├── users.db                    # SQLite database file
│   ├── requirements.txt            # Python dependencies
│   ├── package.json                # Node.js dependencies
│   └── tsconfig.json               # TypeScript configuration
│
└── README.md
```

---

## 🔌 API Endpoints

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Register a new user |
| `/auth/login` | POST | Authenticate user login |
| `/auth/me` | GET | Get current user info |

### Projects
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects` | GET | Get all user projects |
| `/api/projects` | POST | Create a new project |
| `/api/projects/{id}` | GET | Get specific project |
| `/api/projects/{id}` | PUT | Update project |
| `/api/projects/{id}` | DELETE | Delete project |

### Tasks
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tasks` | GET | Get all tasks for a project |
| `/api/tasks` | POST | Create a new task |
| `/api/tasks/{id}` | GET | Get specific task |
| `/api/tasks/{id}` | PUT | Update task |
| `/api/tasks/{id}` | DELETE | Delete task |
| `/api/tasks/{id}/comments` | GET/POST | Manage task comments |

### Utility
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API health check |
| `/health` | GET | Detailed health status |
| `/create-test-users` | POST | Create test users (development) |
| `/users` | GET | List all users (development) |

---

## 🛡️ Authentication Flow

1. **User Registration**: 
   - Send POST request to `/auth/register` with user details
   - Backend hashes password and stores user data
   - Returns JWT token for authentication

2. **User Login**: 
   - Send POST request to `/auth/login` with credentials
   - Backend validates credentials and returns JWT token

3. **Authenticated Requests**: 
   - Include JWT token in `Authorization: Bearer <token>` header
   - Backend validates token for protected routes

---

## 🗄️ Database Schema

### Users Table
- `id` - Primary key
- `username` - Unique username
- `email` - Unique email address
- `password` - Hashed password
- `full_name` - User's full name
- `is_active` - Account status
- `created_at` - Account creation timestamp

### Projects Table
- `id` - Primary key
- `name` - Project name
- `description` - Project description
- `user_id` - Foreign key to Users
- `created_at` - Project creation timestamp

### Tasks Table
- `id` - Primary key
- `title` - Task title
- `description` - Task description
- `status` - Task status (pending, in_progress, completed)
- `priority` - Task priority level
- `due_date` - Task deadline
- `project_id` - Foreign key to Projects
- `user_id` - Foreign key to Users
- `created_at` - Task creation timestamp

---

## 🧪 Development Features

### Test Users
The FastAPI backend includes endpoints to create test users for development:
- **Admin**: `admin@taskero.com` / `admin123`
- **User 1**: `user1@taskero.com` / `user123`
- **User 2**: `user2@taskero.com` / `user123`

### Environment Configuration
Create a `.env` file in the backend directory for custom configuration:
```env
DATABASE_URL=sqlite:///./users.db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

---

## 🚧 Future Improvements

- **🔔 Real-time Notifications**: WebSocket integration for live updates
- **📱 Mobile App**: React Native mobile application
- **☁️ Cloud Deployment**: Docker containerization and cloud hosting
- **🧪 Testing Suite**: Comprehensive unit and integration tests
- **📊 Advanced Analytics**: Detailed productivity metrics and reports
- **🔗 Third-party Integrations**: Calendar sync, email notifications
- **👥 Team Collaboration**: Multi-user project sharing and permissions
- **📁 File Attachments**: Upload and manage files within tasks

---

## 🤝 Contributing

Contributions are welcome! Feel free to fork this repository and submit a pull request.

1. **Fork the repo**
2. **Create a branch**: `git checkout -b feature-xyz`
3. **Commit your changes**: `git commit -m 'Add some feature'`
4. **Push to the branch**: `git push origin feature-xyz`
5. **Create a Pull Request**

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