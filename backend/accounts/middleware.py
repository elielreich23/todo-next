"""
Middleware for session activity tracking
Note: Session timeout checking is handled by SessionAwareJWTAuthentication
This middleware just updates last_activity for authenticated requests
"""

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from .models import UserSession


class SessionActivityMiddleware:
    """
    Middleware to update session last_activity on each authenticated request
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Try to update session activity for authenticated requests
        try:
            # Get JWT token from request
            jwt_auth = JWTAuthentication()
            try:
                header = jwt_auth.get_header(request)
                if header:
                    raw_token = jwt_auth.get_raw_token(header)
                    if raw_token:
                        validated_token = jwt_auth.get_validated_token(raw_token)
                        user = jwt_auth.get_user(validated_token)

                        # Find current session for this user and update activity
                        current_session = UserSession.objects.filter(user=user, is_current=True, revoked=False).first()

                        if current_session:
                            # Update last activity
                            current_session.save(update_fields=["last_activity"])
            except (InvalidToken, TokenError, AttributeError):
                # Token invalid or missing - skip activity update
                pass
        except Exception:  # nosec B110
            # If anything fails, just continue with the request
            # This is intentional - middleware should never break request processing
            pass

        response = self.get_response(request)
        return response
