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
# Automatically include Render or Railway service URL if available
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

# Auto-detect Railway service URL from environment
railway_public_domain = os.environ.get("RAILWAY_PUBLIC_DOMAIN")
if railway_public_domain and railway_public_domain not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(railway_public_domain)

# Also check for Railway custom domain
railway_custom_domain = os.environ.get("RAILWAY_CUSTOM_DOMAIN")
if railway_custom_domain:
    if isinstance(railway_custom_domain, str):
        domains = [s.strip() for s in railway_custom_domain.split(",")]
        for domain in domains:
            if domain and domain not in ALLOWED_HOSTS:
                ALLOWED_HOSTS.append(domain)
    elif railway_custom_domain not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(railway_custom_domain)

# Railway detection: Check if we're running on Railway
# Railway sets various environment variables we can check
is_railway = any(
    [
        os.environ.get("RAILWAY_ENVIRONMENT_NAME"),
        os.environ.get("RAILWAY_SERVICE_NAME"),
        os.environ.get("RAILWAY_PUBLIC_DOMAIN"),
        os.environ.get("RAILWAY_DEPLOYMENT_ID"),
    ]
)

# If on Railway but no specific domain set, we need to handle it dynamically
# Since Django doesn't support wildcards, we'll use middleware (see below)
# For now, add common Railway domain patterns if detected
if is_railway and not any(".up.railway.app" in str(host) for host in ALLOWED_HOSTS):
    # Try to get domain from Railway environment
    # Railway sometimes provides it in different env vars
    railway_domain = (
        os.environ.get("RAILWAY_PUBLIC_DOMAIN")
        or os.environ.get("RAILWAY_STATIC_URL", "").replace("https://", "").replace("http://", "").split("/")[0]
    )
    if railway_domain and railway_domain.endswith(".up.railway.app"):
        if railway_domain not in ALLOWED_HOSTS:
            ALLOWED_HOSTS.append(railway_domain)

# Database configuration for production (PostgreSQL recommended)
# Render and Railway automatically provide DATABASE_URL for linked databases
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

# Add Railway host middleware to handle dynamic Railway domains
# This should be early in the middleware stack, before CommonMiddleware
MIDDLEWARE.insert(0, "taskero_backend.railway_middleware.RailwayHostMiddleware")

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
