"""
Utility functions for session management
"""

from django.utils import timezone

from .device_info import get_client_ip, get_location_from_ip, parse_user_agent
from .models import UserSession


def create_user_session(user, request, token_jti=None):
    """
    Create a new user session after login/signup

    Args:
        user: User instance
        request: Django request object
        token_jti: JWT token ID (optional, for linking session to token)

    Returns:
        UserSession instance
    """
    # Get device information
    user_agent = request.META.get("HTTP_USER_AGENT", "")
    device_info = parse_user_agent(user_agent)
    ip_address = get_client_ip(request)
    location = get_location_from_ip(ip_address)

    # Mark all other sessions as not current
    UserSession.objects.filter(user=user, is_current=True).update(is_current=False)

    # Set expiration to match JWT refresh token lifetime
    # But we'll also check for 15-minute inactivity timeout
    from rest_framework_simplejwt.settings import api_settings

    refresh_lifetime = api_settings.REFRESH_TOKEN_LIFETIME
    expires_at = timezone.now() + refresh_lifetime if refresh_lifetime else None

    # Create new session
    session = UserSession.objects.create(
        user=user,
        device_name=device_info["device_name"],
        browser=device_info["browser"],
        os=device_info["os"],
        ip_address=ip_address,
        location=location,
        user_agent=user_agent,
        is_current=True,
        expires_at=expires_at,
    )

    return session


def revoke_user_session(session_id, user):
    """
    Revoke a specific session

    Args:
        session_id: UUID of the session to revoke
        user: User instance (for authorization check)

    Returns:
        True if session was revoked, False otherwise
    """
    try:
        session = UserSession.objects.get(id=session_id, user=user)
        session.revoke()
        return True
    except UserSession.DoesNotExist:
        return False


def revoke_all_sessions(user, exclude_current=False):
    """
    Revoke all sessions for a user

    Args:
        user: User instance
        exclude_current: If True, don't revoke the current session

    Returns:
        Number of sessions revoked
    """
    queryset = UserSession.objects.filter(user=user, revoked=False)
    if exclude_current:
        queryset = queryset.exclude(is_current=True)

    count = queryset.count()
    for session in queryset:
        session.revoke()

    return count


def update_session_activity(session_id):
    """
    Update last activity timestamp for a session

    Args:
        session_id: UUID of the session
    """
    try:
        session = UserSession.objects.get(id=session_id)
        session.save(update_fields=["last_activity"])  # Triggers auto_now
    except UserSession.DoesNotExist:
        pass
