from django.contrib import admin
from .models import User, Project, Task


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['id', 'username', 'email', 'full_name', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['username', 'email', 'full_name']
    readonly_fields = ['created_at', 'updated_at']
    
    def changelist_view(self, request, extra_context=None):
        # Workaround for Python 3.14 compatibility issue
        extra_context = extra_context or {}
        extra_context['has_add_permission'] = self.has_add_permission(request)
        return super().changelist_view(request, extra_context)
    
    fieldsets = (
        ('User Information', {
            'fields': ('username', 'email', 'full_name', 'password')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'category', 'created_at']
    list_filter = ['category', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    
    def changelist_view(self, request, extra_context=None):
        # Workaround for Python 3.14 compatibility issue
        extra_context = extra_context or {}
        extra_context['has_add_permission'] = self.has_add_permission(request)
        return super().changelist_view(request, extra_context)
    
    fieldsets = (
        ('Project Information', {
            'fields': ('name', 'category', 'description', 'duration', 'contributors')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'project', 'status', 'progress', 'created_at']
    list_filter = ['status', 'category', 'created_at', 'project']
    search_fields = ['title', 'description', 'notes']
    readonly_fields = ['created_at', 'updated_at']
    
    def changelist_view(self, request, extra_context=None):
        # Workaround for Python 3.14 compatibility issue
        extra_context = extra_context or {}
        extra_context['has_add_permission'] = self.has_add_permission(request)
        return super().changelist_view(request, extra_context)
    
    fieldsets = (
        ('Task Information', {
            'fields': ('project', 'title', 'description', 'status', 'category')
        }),
        ('Progress', {
            'fields': ('progress', 'total_steps', 'due_date', 'duration')
        }),
        ('Additional', {
            'fields': ('contributors', 'notes', 'attachments', 'comments'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

