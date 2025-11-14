from django.contrib import admin
from .models import Project, Task


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('name', 'description', 'owner__username', 'owner__email')
    readonly_fields = ('created_at', 'updated_at')
    list_per_page = 25
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'color', 'owner')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'project', 'owner', 'status', 'priority', 'due_date', 'created_at')
    list_filter = ('status', 'priority', 'created_at', 'due_date')
    search_fields = ('title', 'description', 'project__name', 'owner__username', 'owner__email')
    readonly_fields = ('completed_at', 'created_at', 'updated_at')
    list_per_page = 25
    date_hierarchy = 'created_at'
    filter_horizontal = ('assignees',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'project', 'owner')
        }),
        ('Task Details', {
            'fields': ('status', 'priority', 'due_date', 'assignees')
        }),
        ('Timestamps', {
            'fields': ('completed_at', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
