"""
Middleware to handle Railway domain validation dynamically.
This allows Railway domains even if not explicitly in ALLOWED_HOSTS.
Must be placed BEFORE CommonMiddleware in MIDDLEWARE list.
"""

from django.http import HttpRequest  # type: ignore[import]
from django.utils.deprecation import MiddlewareMixin  # type: ignore[import]


class RailwayHostMiddleware(MiddlewareMixin):
    """
    Middleware to allow Railway domains dynamically.
    Railway domains can change, so we check if the host ends with .up.railway.app
    and add it to ALLOWED_HOSTS before CommonMiddleware validates it.
    """

    def process_request(self, request: HttpRequest):
        # Check if we're on Railway
        is_railway = any(
            [
                request.META.get("HTTP_X_RAILWAY_REQUEST_ID"),
                request.META.get("HTTP_X_RAILWAY_EDGE"),
                request.META.get("HTTP_X_RAILWAY_DEPLOYMENT_ID"),
            ]
        )

        # Get the host
        host = request.get_host().split(":")[0]  # Remove port if present

        # If on Railway and host ends with .up.railway.app, allow it
        if is_railway and host.endswith(".up.railway.app"):
            from django.conf import settings  # type: ignore[import]

            # Add to ALLOWED_HOSTS if not already there
            if host not in settings.ALLOWED_HOSTS:
                settings.ALLOWED_HOSTS.append(host)

        # Also check if host contains .up.railway.app (fallback detection)
        elif ".up.railway.app" in host:
            from django.conf import settings  # type: ignore[import]

            if host not in settings.ALLOWED_HOSTS:
                settings.ALLOWED_HOSTS.append(host)

        return None  # Continue processing
