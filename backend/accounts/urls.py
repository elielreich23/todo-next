from django.urls import path

from . import views

urlpatterns = [
    path("signup/", views.signup, name="signup"),
    path("signin/", views.signin, name="signin"),
    path("profile/", views.profile, name="profile"),
    path("profile/update/", views.update_profile, name="update_profile"),
    path("users/", views.list_users, name="list_users"),
    path("users/search/", views.search_users, name="search_users"),
    path("logout/", views.logout, name="logout"),
    path("password/reset/request/", views.request_password_reset, name="request_password_reset"),
    path("password/reset/", views.reset_password, name="reset_password"),
]
