from django.urls import path
from . import views

urlpatterns = [
    # Root and health
    path('', views.root, name='root'),
    path('health', views.health_check, name='health'),
    
    # Authentication
    path('auth/signup', views.signup, name='signup'),
    path('auth/login', views.login, name='login'),
    
    # Projects
    path('api/projects', views.project_list, name='project-list'),
    path('api/projects/', views.project_detail, name='project-detail'),
    
    # Tasks
    path('api/tasks', views.task_list, name='task-list'),
    path('api/tasks/', views.task_detail, name='task-detail'),
    
    # Task comments
    path('api/tasks/<int:task_id>/comments', views.task_comments, name='task-comments'),
    path('api/tasks/<int:task_id>/comments/', views.task_comment_detail, name='task-comment-detail'),
    
    # User profile management
    path('api/user/profile', views.user_profile, name='user-profile'),
    path('api/user/password', views.change_password, name='change-password'),
    path('api/user/account', views.delete_account, name='delete-account'),
    
    # Test endpoints
    path('create-test-users', views.create_test_users, name='create-test-users'),
    path('users', views.get_users, name='get-users'),
]

