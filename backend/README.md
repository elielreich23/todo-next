# Taskero Backend

A Django REST API backend with JWT authentication for the Taskero todo application.

## Features

- JWT Authentication (access + refresh tokens)
- User registration and login
- Custom user model with email as username
- CORS enabled for frontend integration
- Django REST Framework
- Password strength validation with zxcvbn

## Setup

### Option 1: Local Development (SQLite - Recommended for Windows)

For local development, use the local requirements file which excludes PostgreSQL dependencies:

```bash
pip install -r requirements-local.txt
```

### Option 2: Full Installation (Includes PostgreSQL support)

If you need PostgreSQL support, install from the main requirements file:

```bash
pip install -r requirements.txt
```

**Note:** On Windows, `psycopg2-binary` may require additional setup. If you encounter errors, use `requirements-local.txt` for local development with SQLite instead.

### Database Setup

1. Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

2. Create superuser (optional):
```bash
python manage.py createsuperuser
```

3. Start the development server:
```bash
python run.py
# OR
python manage.py runserver
```

The server will run on `http://localhost:8000`

## API Endpoints

### Authentication
- `POST /api/auth/signup/` - User registration
- `POST /api/auth/signin/` - User login
- `GET /api/auth/profile/` - Get user profile (requires authentication)
- `PUT /api/auth/profile/update/` - Update user profile (requires authentication)
- `POST /api/auth/logout/` - Logout (requires authentication)
- `POST /api/auth/password/reset/request/` - Request password reset
- `POST /api/auth/password/reset/` - Reset password with token
- `POST /api/auth/password/check-strength/` - Check password strength (requires authentication)

### Example Requests

**Signup:**
```json
POST /api/auth/signup/
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "full_name": "John Doe",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!"
}
```

**Login:**
```json
POST /api/auth/signin/
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Check Password Strength:**
```json
POST /api/auth/password/check-strength/
Content-Type: application/json

{
  "password": "MyPassword123!",
  "user_inputs": ["john", "johndoe"]  // optional
}
```

## Development

### Running Tests

```bash
python manage.py test
```

### Creating Migrations

```bash
python manage.py makemigrations
```

### Applying Migrations

```bash
python manage.py migrate
```

## Production

For production deployment:
- Use PostgreSQL database
- Set `DJANGO_SETTINGS_MODULE=taskero_backend.settings_production`
- Use `requirements.txt` for all dependencies including `psycopg2-binary`
- Configure environment variables as per `env.example`
