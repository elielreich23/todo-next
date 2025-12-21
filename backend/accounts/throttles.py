"""
Custom throttling classes for authentication endpoints
"""

from django.conf import settings
from rest_framework.throttling import AnonRateThrottle


class SignupThrottle(AnonRateThrottle):
    """Rate limit for signup endpoint - more lenient in development"""

    def get_rate(self):
        # More lenient rate limit in development to prevent false positives
        if getattr(settings, "DEBUG", False):
            return "50/minute"  # 50 per minute in development
        return "20/minute"  # 20 per minute in production


class SigninThrottle(AnonRateThrottle):
    """Stricter rate limit for signin endpoint"""

    rate = "10/minute"


class PasswordResetThrottle(AnonRateThrottle):
    """Stricter rate limit for password reset endpoint"""

    rate = "3/minute"
