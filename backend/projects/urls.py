from django.urls import path

from . import notification_views, views

urlpatterns = [
    # Project URLs
    path("projects/", views.project_list_create, name="project_list_create"),
    path("projects/<int:pk>/", views.project_detail, name="project_detail"),
    # Task URLs
    path("tasks/", views.task_list_create, name="task_list_create"),
    path("tasks/<int:pk>/", views.task_detail, name="task_detail"),
    # Task Comments URLs
    path("tasks/<int:task_id>/comments/", views.task_comments_list_create, name="task_comments_list_create"),
    path("tasks/<int:task_id>/comments/<int:comment_id>/", views.task_comment_detail, name="task_comment_detail"),
    # Task Attachments URLs
    path("tasks/<int:task_id>/attachments/", views.task_attachments_list_create, name="task_attachments_list_create"),
    path("tasks/<int:task_id>/attachments/<int:attachment_id>/", views.task_attachment_detail, name="task_attachment_detail"),
    # Statistics URLs
    path("statistics/", views.statistics_overview, name="statistics_overview"),
    # Notification URLs
    path("notifications/", notification_views.list_notifications, name="list_notifications"),
    path("notifications/unread/", notification_views.unread_notifications, name="unread_notifications"),
    path("notifications/<int:pk>/read/", notification_views.mark_notification_read, name="mark_notification_read"),
    path("notifications/read-all/", notification_views.mark_all_notifications_read, name="mark_all_notifications_read"),
]
