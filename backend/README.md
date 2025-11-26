# Taskero Backend

A Django REST API backend with JWT authentication for the Taskero todo application.

## Features

- JWT Authentication (access + refresh tokens)
- User registration and login
- Custom user model with email as username
- CORS enabled for frontend integration
- Django REST Framework

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

3. Create superuser (optional):
```bash
python manage.py createsuperuser
```

4. Start the development server:
```bash
python run.py
```

The server will run on `http://localhost:8000`

## API Endpoints

### Authentication
- `POST /api/auth/signup/` - User registration
- `POST /api/auth/signin/` - User login
- `GET /api/auth/profile/` - Get user profile (requires authentication)
- `POST /api/auth/logout/` - Logout (requires authentication)

### Example Requests

**Signup:**
```json
POST /api/auth/signup/
{
  "username": "johndoe",
  "email": "john@example.com",
  "full_name": "John Doe",
  "password": "securepassword123",
  "password_confirm": "securepassword123"
}
```

**Signin:**
```json
POST /api/auth/signin/
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

## Default Admin User

- Email: admin@taskero.com
- Password:


## Environment Variables

You can set these environment variables:
- `DJANGO_SETTINGS_MODULE` - Django settings module (default: taskero_backend.settings)
- `DEBUG` - Debug mode (default: True)
- `SECRET_KEY` - Django secret key (default: development key)
