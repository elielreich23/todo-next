import logging

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.db import models
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import (
    PasswordResetRequestSerializer,
    PasswordResetSerializer,
    UserLoginSerializer,
    UserRegistrationSerializer,
    UserSerializer,
)

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([AllowAny])
def signup(request):
    """User registration endpoint"""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "success": True,
                "message": "User created successfully",
                "user": UserSerializer(user).data,
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
            },
            status=status.HTTP_201_CREATED,
        )

    return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
def signin(request):
    """User login endpoint"""
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data["user"]

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "success": True,
                "message": "Login successful",
                "user": UserSerializer(user).data,
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
            },
            status=status.HTTP_200_OK,
        )

    return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


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


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    """Logout endpoint that blacklists the refresh token"""
    refresh_token = request.data.get("refresh")
    if not refresh_token:
        return Response(
            {"success": False, "message": "Refresh token is required to logout"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
    except TokenError:
        return Response({"success": False, "message": "Invalid refresh token"}, status=status.HTTP_400_BAD_REQUEST)

    return Response({"success": True, "message": "Logout successful"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_users(request):
    """List users for assignment (exclude the requester by default)."""
    qs = type(request.user).objects.exclude(id=request.user.id)
    data = UserSerializer(qs, many=True).data
    return Response({"success": True, "users": data})


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
        .filter(models.Q(full_name__icontains=query) | models.Q(username__icontains=query) | models.Q(email__icontains=query))[
            :20
        ]
    )  # Limit to 20 results

    data = UserSerializer(qs, many=True).data
    return Response({"success": True, "users": data})


@api_view(["POST"])
@permission_classes([AllowAny])
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
