from django.urls import path
from . import views

urlpatterns = [
    # Project URLs
    path('projects/', views.project_list_create, name='project_list_create'),
    path('projects/<int:pk>/', views.project_detail, name='project_detail'),
    
    # Task URLs
    path('tasks/', views.task_list_create, name='task_list_create'),
    path('tasks/<int:pk>/', views.task_detail, name='task_detail'),
]
