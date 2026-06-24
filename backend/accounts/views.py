import logging

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError
from django.core.mail import get_connection, send_mail
from django.core.validators import validate_email
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

from .email_utils import normalize_account_email
from .google_auth import verify_google_token
from .models import Team, TeamInvitation, TeamMembership, User, UserSession
from .serializers import (
    PasswordResetRequestSerializer,
    PasswordResetSerializer,
    TeamInvitationSerializer,
    TeamInviteSerializer,
    TeamMembershipSerializer,
    TeamRoleUpdateSerializer,
    TeamSerializer,
    UserLoginSerializer,
    UserRegistrationSerializer,
    UserSerializer,
    UserSessionSerializer,
)
from .session_utils import create_user_session, revoke_all_sessions, revoke_user_session
from .throttles import ContactThrottle, PasswordResetThrottle, SigninThrottle, SignupThrottle

logger = logging.getLogger(__name__)


def get_or_create_default_team(user):
    """Return the user's first team, creating a personal workspace when needed."""
    membership = TeamMembership.objects.filter(user=user).select_related("team").order_by("team__created_at").first()
    if membership:
        return membership.team

    team = Team.objects.create(owner=user, name=f"{user.full_name or user.username}'s Team")
    TeamMembership.objects.create(team=team, user=user, role=TeamMembership.ROLE_OWNER)
    return team


def get_membership(team, user):
    return TeamMembership.objects.filter(team=team, user=user).first()


def can_manage_team(team, user):
    membership = get_membership(team, user)
    return bool(membership and membership.role in [TeamMembership.ROLE_OWNER, TeamMembership.ROLE_ADMIN])


def team_payload(team, user):
    memberships = (
        TeamMembership.objects.filter(team=team).select_related("user").order_by("role", "user__full_name", "user__email")
    )
    invitations = (
        TeamInvitation.objects.filter(team=team, status=TeamInvitation.STATUS_PENDING)
        .select_related("invited_by")
        .order_by("-created_at")
    )
    current_membership = get_membership(team, user)
    return {
        "success": True,
        "team": TeamSerializer(team).data,
        "current_role": current_membership.role if current_membership else None,
        "members": TeamMembershipSerializer(memberships, many=True).data,
        "invitations": TeamInvitationSerializer(invitations, many=True).data,
    }


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([ContactThrottle])
def contact_message(request):
    """Receive landing-page contact form submissions."""
    full_name = str(request.data.get("full_name", "")).strip()
    email = normalize_account_email(str(request.data.get("email", "")).strip())
    organization = str(request.data.get("organization", "")).strip()
    message = str(request.data.get("message", "")).strip()

    errors = {}
    if not full_name:
        errors["full_name"] = ["Full name is required."]
    if not email:
        errors["email"] = ["Email address is required."]
    else:
        try:
            validate_email(email)
        except ValidationError:
            errors["email"] = ["Enter a valid email address."]
    if not message:
        errors["message"] = ["Message is required."]

    if errors:
        return Response({"success": False, "errors": errors}, status=status.HTTP_400_BAD_REQUEST)

    subject = f"New Tasker contact message from {full_name}"
    body = f"""
Name: {full_name}
Email: {email}
Organization: {organization or "Not provided"}

Message:
{message}
"""

    mail_connection = None
    if settings.DEBUG:
        mail_connection = get_connection(backend="django.core.mail.backends.console.EmailBackend")

    try:
        send_mail(
            subject,
            body,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@tasker.com"),
            recipient_list=[
                getattr(
                    settings,
                    "CONTACT_EMAIL",
                    getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@tasker.com"),
                )
            ],
            fail_silently=False,
            connection=mail_connection,
        )
    except Exception as e:
        logger.error(f"Error sending contact message: {e}", exc_info=True)
        return Response(
            {"success": False, "message": "We could not send your message. Please try again later."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response({"success": True, "message": "Message sent successfully."}, status=status.HTTP_200_OK)


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


@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def team_overview(request):
    """Read or update the current user's default team."""
    team = get_or_create_default_team(request.user)

    if request.method == "GET":
        return Response(team_payload(team, request.user))

    if not can_manage_team(team, request.user):
        return Response(
            {"success": False, "message": "Only team owners and admins can update the team"},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = TeamSerializer(team, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        team.refresh_from_db()
        return Response(team_payload(team, request.user))

    return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def invite_team_member(request):
    """Create or refresh a pending team invitation."""
    team = get_or_create_default_team(request.user)

    if not can_manage_team(team, request.user):
        return Response(
            {"success": False, "message": "Only team owners and admins can invite members"},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = TeamInviteSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data["email"]
    role = serializer.validated_data["role"]

    existing_user = User.objects.filter(email=email).first()
    if existing_user and TeamMembership.objects.filter(team=team, user=existing_user).exists():
        return Response(
            {"success": False, "message": "That user is already a member of this team"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    invitation, _created = TeamInvitation.objects.update_or_create(
        team=team,
        email=email,
        status=TeamInvitation.STATUS_PENDING,
        defaults={"role": role, "invited_by": request.user},
    )

    try:
        send_mail(
            f"You've been invited to {team.name}",
            f"{request.user.full_name or request.user.email} invited you to join {team.name} as {role}.",
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@tasker.com"),
            recipient_list=[email],
            fail_silently=True,
        )
    except Exception as e:
        logger.info(f"Team invite email could not be sent: {e}")

    return Response(
        {"success": True, "invitation": TeamInvitationSerializer(invitation).data},
        status=status.HTTP_201_CREATED,
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def revoke_team_invitation(request, invitation_id):
    """Revoke a pending invitation."""
    team = get_or_create_default_team(request.user)

    if not can_manage_team(team, request.user):
        return Response(
            {"success": False, "message": "Only team owners and admins can revoke invitations"},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        invitation = TeamInvitation.objects.get(id=invitation_id, team=team, status=TeamInvitation.STATUS_PENDING)
    except TeamInvitation.DoesNotExist:
        return Response({"success": False, "message": "Invitation not found"}, status=status.HTTP_404_NOT_FOUND)

    invitation.status = TeamInvitation.STATUS_REVOKED
    invitation.save(update_fields=["status", "updated_at"])
    return Response({"success": True, "message": "Invitation revoked"})


@api_view(["PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def team_member_detail(request, membership_id):
    """Change a member role or remove a member."""
    team = get_or_create_default_team(request.user)
    current_membership = get_membership(team, request.user)

    if not current_membership or current_membership.role != TeamMembership.ROLE_OWNER:
        return Response(
            {"success": False, "message": "Only the team owner can manage member roles"},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        membership = TeamMembership.objects.select_related("user").get(id=membership_id, team=team)
    except TeamMembership.DoesNotExist:
        return Response({"success": False, "message": "Team member not found"}, status=status.HTTP_404_NOT_FOUND)

    if membership.role == TeamMembership.ROLE_OWNER:
        return Response(
            {"success": False, "message": "The team owner cannot be modified here"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if request.method == "DELETE":
        membership.delete()
        return Response({"success": True, "message": "Team member removed"})

    serializer = TeamRoleUpdateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    membership.role = serializer.validated_data["role"]
    membership.save(update_fields=["role", "updated_at"])
    return Response({"success": True, "member": TeamMembershipSerializer(membership).data})


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
    """List users for assignment (exclude the requester by default) with pagination."""
    from projects.pagination import UserPagination

    paginator = UserPagination()
    # No need for select_related here as User model doesn't have foreign keys in this context
    qs = type(request.user).objects.exclude(id=request.user.id).order_by("full_name", "username")
    paginated_users = paginator.paginate_queryset(qs, request)
    serializer = UserSerializer(paginated_users, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def search_users(request):
    """Search users by name, username, or email (minimum 3 characters) with pagination."""
    from projects.pagination import UserPagination

    query = request.GET.get("q", "").strip()

    if len(query) < 3:
        return Response({"success": True, "users": [], "message": "Please enter at least 3 characters to search"})

    # Search in full_name, username, and email with pagination
    qs = (
        type(request.user)
        .objects.exclude(id=request.user.id)
        .filter(models.Q(full_name__icontains=query) | models.Q(username__icontains=query) | models.Q(email__icontains=query))
        .order_by("full_name", "username")
    )

    paginator = UserPagination()
    paginated_users = paginator.paginate_queryset(qs, request)
    serializer = UserSerializer(paginated_users, many=True)

    # Return paginated response if page parameter is provided
    if request.query_params.get("page"):
        return paginator.get_paginated_response(serializer.data)

    # Limit to 20 results if no pagination
    data = serializer.data[:20]
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
            "token": token if getattr(settings, "PASSWORD_RESET_DEBUG_TOKENS", False) else None,
            "uid": uid if getattr(settings, "PASSWORD_RESET_DEBUG_TOKENS", False) else None,
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

    email = normalize_account_email(google_user_info.get("email"))
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
