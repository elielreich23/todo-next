"""
Django settings for taskero_backend project.
"""

import os
from datetime import timedelta
from pathlib import Path

import dj_database_url

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
# On Render, set the SECRET_KEY environment variable to a strong random value.
SECRET_KEY = os.getenv("SECRET_KEY", "django-insecure-fallback-for-local-dev-only")

# SECURITY WARNING: don't run with debug turned on in production!
# On Render, set DEBUG=False
DEBUG = os.getenv("DEBUG", "False").lower() == "true"

# On Render, set ALLOWED_HOSTS=your-app.onrender.com
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

# CSRF trusted origins — set via environment variable on Render:
#   CSRF_TRUSTED_ORIGINS=https://your-app.onrender.com,https://your-vercel-app.vercel.app
_csrf_default = "http://localhost:3000,http://127.0.0.1:3000"
CSRF_TRUSTED_ORIGINS = [
    origin.strip() for origin in os.getenv("CSRF_TRUSTED_ORIGINS", _csrf_default).split(",") if origin.strip()
]


# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "accounts",
    "projects",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    # WhiteNoise must come right after SecurityMiddleware for static file serving
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "taskero_backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "taskero_backend.wsgi.application"
ASGI_APPLICATION = "taskero_backend.asgi.application"


# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases
#
# Production: Supabase PostgreSQL
#   Set DATABASE_URL on Render to your Supabase connection string, e.g.:
#   postgresql://user:password@db.xxxx.supabase.co:5432/postgres
#
# Alternative: Render-managed PostgreSQL
#   If you switch to Render's built-in database, Render automatically provides
#   DATABASE_URL — no other change needed.
#
# Local fallback: SQLite (only when DATABASE_URL is not set)
_sqlite_default = f"sqlite:///{BASE_DIR / 'db.sqlite3'}"
DATABASES = {
    "default": dj_database_url.config(
        default=os.getenv("DATABASE_URL", _sqlite_default),
        conn_max_age=600,
        ssl_require=os.getenv("DATABASE_SSL_REQUIRE", "True").lower() == "true",
    )
}


# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {
            "min_length": 8,
        },
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# Custom User Model
AUTH_USER_MODEL = "accounts.User"

# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/

STATIC_URL = "/static/"
# Collected static files go here; Render's build.sh runs collectstatic automatically
STATIC_ROOT = BASE_DIR / "staticfiles"
# WhiteNoise: compress and cache static files for production
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# Media files (User uploads)
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# File upload settings
FILE_UPLOAD_MAX_MEMORY_SIZE = 209715200  # 200 MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 209715200  # 200 MB

# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Django REST Framework
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "accounts.authentication.SessionAwareJWTAuthentication",
        # Uncomment below to enable Supabase JWT authentication in Strategy 2:
        # "accounts.authentication.SupabaseJWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "10/minute",  # Anonymous users: 10 requests per minute (stricter for auth endpoints)
        "user": "1000/hour",  # Authenticated users: 1000 requests per hour
    },
    "EXCEPTION_HANDLER": "accounts.rate_limit_handler.rate_limit_handler",
}

# Simple JWT
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
}

# CORS settings
# On Render, set CORS_ALLOWED_ORIGINS to your Vercel (or other frontend) URL:
#   CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
_cors_default = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001"
CORS_ALLOWED_ORIGINS = [
    origin.strip() for origin in os.getenv("CORS_ALLOWED_ORIGINS", _cors_default).split(",") if origin.strip()
]

# Allow all origins only in local development (DEBUG=True)
CORS_ALLOW_ALL_ORIGINS = DEBUG

CORS_ALLOW_CREDENTIALS = True

# CORS headers
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]

# Email configuration for password reset
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "True").lower() == "true"
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
default_email_backend = (
    "django.core.mail.backends.smtp.EmailBackend"
    if EMAIL_HOST_USER and EMAIL_HOST_PASSWORD
    else "django.core.mail.backends.console.EmailBackend"
)
# In DEBUG, default to console email so contact forms do not block on SMTP timeouts.
if DEBUG and not os.getenv("EMAIL_BACKEND"):
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
else:
    EMAIL_BACKEND = os.getenv("EMAIL_BACKEND", default_email_backend)
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", EMAIL_HOST_USER or "noreply@taskero.com")
CONTACT_EMAIL = os.getenv("CONTACT_EMAIL", DEFAULT_FROM_EMAIL)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
PASSWORD_RESET_DEBUG_TOKENS = os.getenv("PASSWORD_RESET_DEBUG_TOKENS", "False").lower() == "true"

# Google OAuth Configuration
GOOGLE_OAUTH_CLIENT_ID = os.getenv("GOOGLE_OAUTH_CLIENT_ID", "")

# Supabase Configuration for Strategy 2 (future integration)
# Uncomment to enable:
# SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")

# Optional URL-safe base64 Fernet key for encrypted model fields.
# If omitted, a deterministic key derived from SECRET_KEY is used.
FIELD_ENCRYPTION_KEY = os.getenv("FIELD_ENCRYPTION_KEY", "")

# Cache configuration for rate limiting
# Using in-memory cache for development (use Redis in production)
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "unique-snowflake",
    }
}

# Rate limiting configuration
RATELIMIT_ENABLE = os.getenv("RATELIMIT_ENABLE", "True").lower() == "true"
RATELIMIT_USE_CACHE = "default"
