import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

from .encrypted_fields import EncryptedTextField


class User(AbstractUser):
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=40, blank=True)
    bio = models.TextField(blank=True)
    notification_preferences = models.JSONField(default=dict, blank=True)

    # Use email as the username field
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "full_name"]

    def __str__(self):
        return self.email


class UserSession(models.Model):
    """Track active user sessions across devices"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sessions")
    device_name = models.CharField(max_length=255, blank=True)
    browser = models.CharField(max_length=100, blank=True)
    os = models.CharField(max_length=100, blank=True)
    # Store sensitive device telemetry encrypted at rest.
    ip_address = EncryptedTextField(null=True, blank=True)
    location = EncryptedTextField(blank=True)  # City, Country
    user_agent = EncryptedTextField(blank=True)
    is_current = models.BooleanField(default=False)  # Current session
    last_activity = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    revoked = models.BooleanField(default=False)
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-last_activity"]
        indexes = [
            models.Index(fields=["user", "revoked"]),
            models.Index(fields=["user", "is_current"]),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.device_name or 'Unknown Device'}"

    def revoke(self):
        """Revoke this session"""
        self.revoked = True
        self.revoked_at = timezone.now()
        self.is_current = False
        self.save()

    def is_active(self):
        """Check if session is still active"""
        if self.revoked:
            return False
        if self.expires_at and timezone.now() > self.expires_at:
            return False
        # Check for 15-minute inactivity timeout
        from datetime import timedelta

        inactivity_timeout = timedelta(minutes=15)
        if timezone.now() - self.last_activity > inactivity_timeout:
            return False
        return True


class Team(models.Model):
    """A workspace for collaboration and role-based access."""

    name = models.CharField(max_length=255)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="owned_teams")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class TeamMembership(models.Model):
    ROLE_OWNER = "owner"
    ROLE_ADMIN = "admin"
    ROLE_MEMBER = "member"
    ROLE_CHOICES = [
        (ROLE_OWNER, "Owner"),
        (ROLE_ADMIN, "Admin"),
        (ROLE_MEMBER, "Member"),
    ]

    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="memberships")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="team_memberships")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_MEMBER)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("team", "user")
        ordering = ["role", "user__full_name", "user__email"]
        indexes = [
            models.Index(fields=["team", "role"]),
            models.Index(fields=["user", "role"]),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.team.name} ({self.role})"


class TeamInvitation(models.Model):
    STATUS_PENDING = "pending"
    STATUS_ACCEPTED = "accepted"
    STATUS_REVOKED = "revoked"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_ACCEPTED, "Accepted"),
        (STATUS_REVOKED, "Revoked"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="invitations")
    email = models.EmailField()
    role = models.CharField(max_length=20, choices=TeamMembership.ROLE_CHOICES, default=TeamMembership.ROLE_MEMBER)
    invited_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_team_invitations")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["team", "status"]),
            models.Index(fields=["email", "status"]),
        ]

    def __str__(self):
        return f"{self.email} invited to {self.team.name}"
