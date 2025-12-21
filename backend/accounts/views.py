import logging

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.db import models
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode

# Rate limiting is handled by DRF throttling classes (see throttles.py)
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .google_auth import verify_google_token
from .models import User, UserSession
from .serializers import (
    PasswordResetRequestSerializer,
    PasswordResetSerializer,
    UserLoginSerializer,
    UserRegistrationSerializer,
    UserSerializer,
    UserSessionSerializer,
)
from .session_utils import create_user_session, revoke_all_sessions, revoke_user_session
from .throttles import PasswordResetThrottle, SigninThrottle, SignupThrottle

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([SignupThrottle])
def signup(request):
    """User registration endpoint"""
    try:
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)

            # Create user session
            session = create_user_session(user, request)

            return Response(
                {
                    "success": True,
                    "message": "User created successfully",
                    "user": UserSerializer(user).data,
                    "tokens": {
                        "access": str(refresh.access_token),
                        "refresh": str(refresh),
                    },
                    "session_id": str(session.id),
                },
                status=status.HTTP_201_CREATED,
            )

        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Error in signup view: {e}", exc_info=True)
        import traceback

        logger.error(f"Traceback: {traceback.format_exc()}")
        # Don't expose internal error details to users
        from django.conf import settings

        error_message = "An error occurred during registration. Please try again."
        if settings.DEBUG:
            error_message = f"An error occurred during registration: {str(e)}"
        return Response(
            {"success": False, "message": error_message},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([SigninThrottle])
def signin(request):
    """User login endpoint"""
    try:
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data["user"]

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)

            # Create user session
            session = create_user_session(user, request)

            return Response(
                {
                    "success": True,
                    "message": "Login successful",
                    "user": UserSerializer(user).data,
                    "tokens": {
                        "access": str(refresh.access_token),
                        "refresh": str(refresh),
                    },
                    "session_id": str(session.id),
                },
                status=status.HTTP_200_OK,
            )

        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Error in signin view: {e}", exc_info=True)
        return Response(
            {"success": False, "message": "An error occurred during login. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def profile(request):
    """Get user profile"""
    serializer = UserSerializer(request.user)
    return Response({"success": True, "user": serializer.data})


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Update user profile"""
    serializer = UserSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({"success": True, "message": "Profile updated successfully", "user": serializer.data})

    return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_sessions(request):
    """List all active sessions for the authenticated user"""
    sessions = UserSession.objects.filter(user=request.user, revoked=False).order_by("-last_activity")
    serializer = UserSessionSerializer(sessions, many=True)
    return Response({"success": True, "sessions": serializer.data})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def revoke_session(request):
    """Revoke a specific session"""
    session_id = request.data.get("session_id")
    if not session_id:
        return Response(
            {"success": False, "message": "session_id is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if revoke_user_session(session_id, request.user):
        return Response({"success": True, "message": "Session revoked successfully"})
    else:
        return Response(
            {"success": False, "message": "Session not found or already revoked"},
            status=status.HTTP_404_NOT_FOUND,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def revoke_all_sessions_view(request):
    """Revoke all sessions except the current one"""
    exclude_current = request.data.get("exclude_current", True)
    count = revoke_all_sessions(request.user, exclude_current=exclude_current)
    return Response({"success": True, "message": f"{count} session(s) revoked successfully", "revoked_count": count})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    """Logout endpoint that blacklists the refresh token and revokes current session"""
    refresh_token = request.data.get("refresh")
    if not refresh_token:
        return Response(
            {"success": False, "message": "Refresh token is required to logout"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        token = RefreshToken(refresh_token)
        token.blacklist()

        # Revoke current session
        current_session = UserSession.objects.filter(user=request.user, is_current=True, revoked=False).first()

        if current_session:
            current_session.revoke()
    except TokenError:
        return Response({"success": False, "message": "Invalid refresh token"}, status=status.HTTP_400_BAD_REQUEST)

    return Response({"success": True, "message": "Logout successful"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_users(request):
    """List users for assignment (exclude the requester by default)."""
    from rest_framework.pagination import PageNumberPagination

    class UserPagination(PageNumberPagination):
        page_size = 50
        page_size_query_param = "page_size"
        max_page_size = 100

    paginator = UserPagination()
    qs = type(request.user).objects.exclude(id=request.user.id).order_by("full_name", "username")
    paginated_users = paginator.paginate_queryset(qs, request)
    serializer = UserSerializer(paginated_users, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def search_users(request):
    """Search users by name, username, or email (minimum 3 characters)."""
    query = request.GET.get("q", "").strip()

    if len(query) < 3:
        return Response({"success": True, "users": [], "message": "Please enter at least 3 characters to search"})

    # Search in full_name, username, and email
    qs = (
        type(request.user)
        .objects.exclude(id=request.user.id)
        .filter(models.Q(full_name__icontains=query) | models.Q(username__icontains=query) | models.Q(email__icontains=query))
        .order_by("full_name", "username")[:20]
    )  # Limit to 20 results

    data = UserSerializer(qs, many=True).data
    return Response({"success": True, "users": data})


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([PasswordResetThrottle])
def request_password_reset(request):
    """Request password reset - sends email with reset token"""
    serializer = PasswordResetRequestSerializer(data=request.data)

    if not serializer.is_valid():
        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data["email"]

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Don't reveal if email exists or not for security
        return Response(
            {"success": True, "message": "If an account with this email exists, a password reset link has been sent."},
            status=status.HTTP_200_OK,
        )

    # Generate token and uid
    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))

    # Build reset URL - frontend URL with token and uid
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
    reset_url = f"{frontend_url}/auth/forgetPwd_1?token={token}&uid={uid}"

    # Send email (if email backend is configured)
    try:
        subject = "Password Reset Request"
        message = f"""
Hello {user.full_name},

You requested to reset your password. Please click the link below to reset your password:

{reset_url}

This link will expire in 24 hours.

If you didn't request this, please ignore this email.

Best regards,
Tasker Team
"""
        send_mail(
            subject,
            message,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@tasker.com"),
            recipient_list=[email],
            fail_silently=False,
        )
        logger.info(f"Password reset email sent to {email}")
    except Exception as e:
        # Log error but still return success (don't reveal email errors)
        logger.error(f"Error sending password reset email: {e}", exc_info=True)

    return Response(
        {
            "success": True,
            "message": "If an account with this email exists, a password reset link has been sent.",
            # Include token in response for development (remove in production or use email only)
            "token": token if settings.DEBUG else None,
            "uid": uid if settings.DEBUG else None,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([PasswordResetThrottle])
def reset_password(request):
    """Reset password using token and uid"""
    serializer = PasswordResetSerializer(data=request.data)

    if not serializer.is_valid():
        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    token = serializer.validated_data["token"]
    uid = serializer.validated_data["uid"]
    password = serializer.validated_data["password"]

    try:
        # Decode user id
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response({"success": False, "message": "Invalid reset link"}, status=status.HTTP_400_BAD_REQUEST)

    # Verify token
    if not default_token_generator.check_token(user, token):
        return Response({"success": False, "message": "Invalid or expired reset token"}, status=status.HTTP_400_BAD_REQUEST)

    # Set new password
    user.set_password(password)
    user.save()

    return Response({"success": True, "message": "Password has been reset successfully"}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([SigninThrottle])
def google_auth(request):
    """Authenticate user with Google OAuth token"""
    token = request.data.get("token")

    if not token:
        return Response(
            {"success": False, "message": "Google token is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Verify Google token
    google_user_info = verify_google_token(token)

    if not google_user_info:
        return Response(
            {"success": False, "message": "Invalid Google token"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    email = google_user_info.get("email")
    if not email or not google_user_info.get("email_verified"):
        return Response(
            {"success": False, "message": "Email not verified by Google"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Get or create user
    try:
        user = User.objects.get(email=email)
        # Update user info if needed
        if google_user_info.get("name") and not user.full_name:
            user.full_name = google_user_info["name"]
            user.save()
    except User.DoesNotExist:
        # Create new user from Google info
        username = google_user_info.get("sub", email.split("@")[0])  # Use Google sub or email prefix
        full_name = google_user_info.get("name", google_user_info.get("given_name", ""))

        # Ensure username is unique
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        # Create user with a secure random password for OAuth users
        # Users can set a password later if needed via password reset
        import secrets

        random_password = secrets.token_urlsafe(32)
        user = User.objects.create_user(
            username=username,
            email=email,
            full_name=full_name or email.split("@")[0],
            password=random_password,  # OAuth users get random password (can be changed later)
        )

    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)

    # Create user session
    session = create_user_session(user, request)

    return Response(
        {
            "success": True,
            "message": "Authentication successful",
            "session_id": str(session.id),
            "user": UserSerializer(user).data,
            "tokens": {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
        },
        status=status.HTTP_200_OK,
    )
