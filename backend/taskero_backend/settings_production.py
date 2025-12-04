"""
Production settings for taskero_backend project.
"""

# flake8: noqa

import os
from pathlib import Path

import dj_database_url
from decouple import config

from .settings import *  # Import base settings

# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config("SECRET_KEY", default="django-insecure-change-this-in-production")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config("DEBUG", default=False, cast=bool)

# Update ALLOWED_HOSTS for production
# Automatically include Render service URL if available
allowed_hosts_str = config("ALLOWED_HOSTS", default="localhost,127.0.0.1")
if isinstance(allowed_hosts_str, str):
    ALLOWED_HOSTS = [s.strip() for s in allowed_hosts_str.split(",")]
else:
    ALLOWED_HOSTS = allowed_hosts_str

# Auto-detect Render service URL from environment
render_service_url = os.environ.get("RENDER_EXTERNAL_URL")
if render_service_url:
    # Extract hostname from URL (e.g., "https://taskero-backend.onrender.com" -> "taskero-backend.onrender.com")
    from urllib.parse import urlparse

    parsed_url = urlparse(render_service_url)
    if parsed_url.hostname and parsed_url.hostname not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(parsed_url.hostname)

# Database configuration for production (PostgreSQL recommended)
# Render automatically provides DATABASE_URL for linked databases
DATABASES = {
    "default": dj_database_url.config(
        default=config("DATABASE_URL", default="sqlite:///db.sqlite3"),
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# CORS settings for production
cors_origins_str = config("CORS_ALLOWED_ORIGINS", default="http://localhost:3000")
if isinstance(cors_origins_str, str):
    CORS_ALLOWED_ORIGINS = [s.strip() for s in cors_origins_str.split(",")]
else:
    CORS_ALLOWED_ORIGINS = cors_origins_str

# Also allow CORS for common Vercel domains (you can override this with env var)
# This helps during initial setup, but you should set CORS_ALLOWED_ORIGINS explicitly
CORS_ALLOW_CREDENTIALS = True

# For additional security, you can use CORS_ALLOWED_ORIGIN_REGEXES for dynamic Vercel preview URLs
# Uncomment and customize if needed:
# CORS_ALLOWED_ORIGIN_REGEXES = [
#     r"^https://.*\.vercel\.app$",
# ]

# Static files configuration
STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")

# Add WhiteNoise middleware for static files
MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")

# Security settings for production
SECURE_SSL_REDIRECT = config("SECURE_SSL_REDIRECT", default=False, cast=bool)
SESSION_COOKIE_SECURE = config("SESSION_COOKIE_SECURE", default=False, cast=bool)
CSRF_COOKIE_SECURE = config("CSRF_COOKIE_SECURE", default=False, cast=bool)
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

# Logging configuration
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}
