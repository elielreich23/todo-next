"""
Custom JWT authentication with session timeout checking
"""

from datetime import timedelta

from django.utils import timezone
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from .models import UserSession


class SessionAwareJWTAuthentication(JWTAuthentication):
    """
    JWT Authentication that also checks for session timeout
    """

    INACTIVITY_TIMEOUT = timedelta(minutes=15)

    def authenticate(self, request):
        """
        Authenticate the request and check session timeout
        """
        # First, try standard JWT authentication
        try:
            header = self.get_header(request)
            if header is None:
                return None

            raw_token = self.get_raw_token(header)
            if raw_token is None:
                return None

            validated_token = self.get_validated_token(raw_token)
            user = self.get_user(validated_token)

            # Check if user has an active session
            current_session = UserSession.objects.filter(user=user, is_current=True, revoked=False).first()

            if current_session:
                # Check for inactivity timeout
                time_since_activity = timezone.now() - current_session.last_activity
                if time_since_activity > self.INACTIVITY_TIMEOUT:
                    # Session expired - revoke it
                    current_session.revoke()
                    raise InvalidToken("Session expired due to inactivity")

                # Update last activity
                current_session.save(update_fields=["last_activity"])
            else:
                # No active session found - user needs to login again
                raise InvalidToken("No active session found")

            return (user, validated_token)

        except (InvalidToken, TokenError):
            # Re-raise authentication errors
            raise
        except Exception:
            # For any other error, return None (unauthenticated)
            return None
