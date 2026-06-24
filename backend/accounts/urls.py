from django.urls import path

from . import views

urlpatterns = [
    path("contact/", views.contact_message, name="contact_message"),
    path("signup/", views.signup, name="signup"),
    path("signin/", views.signin, name="signin"),
    path("profile/", views.profile, name="profile"),
    path("profile/update/", views.update_profile, name="update_profile"),
    path("team/", views.team_overview, name="team_overview"),
    path("team/invitations/", views.invite_team_member, name="team_invite"),
    path("team/invitations/<uuid:invitation_id>/", views.revoke_team_invitation, name="team_invite_revoke"),
    path("team/members/<int:membership_id>/", views.team_member_detail, name="team_member_detail"),
    path("users/", views.list_users, name="list_users"),
    path("users/search/", views.search_users, name="search_users"),
    path("logout/", views.logout, name="logout"),
    path("password/reset/request/", views.request_password_reset, name="request_password_reset"),
    path("password/reset/", views.reset_password, name="reset_password"),
    path("google/", views.google_auth, name="google_auth"),
    path("sessions/", views.list_sessions, name="list_sessions"),
    path("sessions/revoke/", views.revoke_session, name="revoke_session"),
    path("sessions/revoke-all/", views.revoke_all_sessions_view, name="revoke_all_sessions"),
]
