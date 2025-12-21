from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User, UserSession


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ("email", "username", "full_name", "is_active", "date_joined")
    list_filter = ("is_active", "is_staff", "date_joined")
    search_fields = ("email", "username", "full_name")
    ordering = ("-date_joined",)

    fieldsets = (
        (None, {"fields": ("username", "email", "password")}),
        ("Personal info", {"fields": ("first_name", "last_name", "full_name")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("username", "email", "full_name", "password1", "password2"),
            },
        ),
    )


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "device_name",
        "browser",
        "os",
        "ip_address",
        "is_current",
        "revoked",
        "last_activity",
        "created_at",
    )
    list_filter = ("is_current", "revoked", "os", "browser", "created_at")
    search_fields = ("user__email", "user__username", "device_name", "ip_address")
    readonly_fields = ("id", "created_at", "last_activity", "revoked_at")
    ordering = ("-last_activity",)

    fieldsets = (
        ("Session Info", {"fields": ("id", "user")}),
        ("Device Info", {"fields": ("device_name", "browser", "os", "ip_address", "location", "user_agent")}),
        ("Status", {"fields": ("is_current", "revoked", "revoked_at")}),
        ("Timestamps", {"fields": ("created_at", "last_activity", "expires_at")}),
    )
