import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)

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
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    location = models.CharField(max_length=255, blank=True)  # City, Country
    user_agent = models.TextField(blank=True)
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
