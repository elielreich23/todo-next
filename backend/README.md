# Taskero Backend

Django REST Framework backend for the Taskero task management application.

## Features

- **Authentication**: User signup/login with password hashing
- **Projects**: CRUD operations for projects
- **Tasks**: CRUD operations for tasks with status management
- **Comments**: Add/edit/delete comments on tasks
- **Database**: SQLite with SQLAlchemy ORM

## API Endpoints

### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create new project
- `PUT /api/projects` - Update project
- `DELETE /api/projects` - Delete project

### Tasks
- `GET /api/tasks` - Get tasks (optional project_id filter)
- `POST /api/tasks` - Create new task
- `PUT /api/tasks` - Update task
- `DELETE /api/tasks` - Delete task

### Task Comments
- `GET /api/tasks/{task_id}/comments` - Get task comments
- `POST /api/tasks/{task_id}/comments` - Add comment
- `PUT /api/tasks/{task_id}/comments` - Update comment
- `DELETE /api/tasks/{task_id}/comments` - Delete comment

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run migrations to create database tables:
```bash
python manage.py makemigrations
python manage.py migrate
```

3. Create a superuser for Django admin (optional):
```bash
python manage.py createsuperuser
```

4. Run the server:
```bash
python manage.py runserver 0.0.0.0:3001
```

Or use the run script:
```bash
python run.py
```

The server will start on `http://localhost:3001`

## Database

The app uses SQLite with Django's ORM. The database file is `db.sqlite3`.

## Django Admin Panel

Access the admin panel at `http://localhost:3001/admin/`

You can manage Users, Projects, and Tasks directly from the admin interface.

## Test Users

You can create test users by calling:
```
POST /create-test-users
```

This creates:
- admin@taskero.com / admin123
- user1@taskero.com / user123  
- user2@taskero.com / user123
