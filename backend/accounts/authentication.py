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


# ==============================================================================
# FUTURE STRATEGY 2 MOCKUP: SUPABASE AUTH INTEGRATION
# ==============================================================================
# To enable this in the future:
# 1. Install PyJWT: pip install PyJWT
# 2. Add SUPABASE_JWT_SECRET to your environment and settings.py
# 3. Add 'accounts.authentication.SupabaseJWTAuthentication' to DEFAULT_AUTHENTICATION_CLASSES in settings.py
#
# import jwt
# from django.conf import settings
# from django.contrib.auth import get_user_model
# from rest_framework import authentication, exceptions
#
# User = get_user_model()
#
# class SupabaseJWTAuthentication(authentication.BaseAuthentication):
#     """
#     Custom REST Framework authentication backend that verifies Supabase JWTs.
#     """
#     def authenticate(self, request):
#         auth_header = request.headers.get("Authorization")
#         if not auth_header:
#             return None
#
#         parts = auth_header.split(" ")
#         if len(parts) != 2 or parts[0].lower() != "bearer":
#             return None
#
#         token = parts[1]
#
#         try:
#             # Decode the token using your Supabase JWT Secret
#             payload = jwt.decode(
#                 token,
#                 settings.SUPABASE_JWT_SECRET,
#                 algorithms=["HS256"],
#                 options={"verify_aud": True},
#                 audience="authenticated"
#             )
#         except jwt.ExpiredSignatureError:
#             raise exceptions.AuthenticationFailed("Supabase token has expired.")
#         except jwt.InvalidTokenError:
#             raise exceptions.AuthenticationFailed("Invalid Supabase token.")
#
#         # Identify user by email from the JWT payload
#         email = payload.get("email")
#         if not email:
#             raise exceptions.AuthenticationFailed("Email not present in Supabase token.")
#
#         # Get or dynamically create the local Django user
#         # This links the Supabase user identity to a Django user record
#         user, created = User.objects.get_or_create(
#             email=email,
#             defaults={
#                 "username": email.split("@")[0],
#                 "full_name": payload.get("user_metadata", {}).get("full_name", ""),
#             }
#         )
#
#         return (user, None)
